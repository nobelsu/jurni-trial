import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import type { PlaceLabel, Position, SearchResult } from "./mapbox";
import type { SearchHistoryEntry } from "./users";

type CachedValue<T> = {
  value: T;
  updatedAt: number;
};

const SEARCH_CACHE_KEY = "searchbox_cache_v1";
const REVERSE_CACHE_KEY = "reverse_geocode_cache_v1";
const MAPBOX_ACCESS_TOKEN = process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN;
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const SEARCH_CACHE_LIMIT = 50;
const REVERSE_CACHE_LIMIT = 80;
const REVERSE_COORD_PRECISION = 4; // ~11m, enough to avoid duplicate nearby reverse lookups.

let searchCacheLoaded = false;
let reverseCacheLoaded = false;

const searchCache = new Map<string, CachedValue<SearchResult[]>>();
const reverseCache = new Map<string, CachedValue<PlaceLabel>>();

function now() {
  return Date.now();
}

function isFresh(updatedAt: number) {
  return now() - updatedAt <= CACHE_TTL_MS;
}

function toLimitedSerializable<T>(map: Map<string, CachedValue<T>>, limit: number) {
  return Array.from(map.entries()).slice(-limit);
}

function parseStoredEntries<T>(raw: string | null): Array<[string, CachedValue<T>]> {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as Array<[string, CachedValue<T>]>;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item) => {
      return (
        Array.isArray(item) &&
        typeof item[0] === "string" &&
        item[1] != null &&
        typeof item[1].updatedAt === "number"
      );
    });
  } catch {
    return [];
  }
}

async function loadSearchCache() {
  if (searchCacheLoaded) return;
  searchCacheLoaded = true;
  const entries = parseStoredEntries<SearchResult[]>(
    await AsyncStorage.getItem(SEARCH_CACHE_KEY)
  );
  entries.forEach(([key, value]) => {
    if (isFresh(value.updatedAt)) {
      searchCache.set(key, value);
    }
  });
}

async function loadReverseCache() {
  if (reverseCacheLoaded) return;
  reverseCacheLoaded = true;
  const entries = parseStoredEntries<PlaceLabel>(
    await AsyncStorage.getItem(REVERSE_CACHE_KEY)
  );
  entries.forEach(([key, value]) => {
    if (isFresh(value.updatedAt)) {
      reverseCache.set(key, value);
    }
  });
}

async function persistSearchCache() {
  await AsyncStorage.setItem(
    SEARCH_CACHE_KEY,
    JSON.stringify(toLimitedSerializable(searchCache, SEARCH_CACHE_LIMIT))
  );
}

async function persistReverseCache() {
  await AsyncStorage.setItem(
    REVERSE_CACHE_KEY,
    JSON.stringify(toLimitedSerializable(reverseCache, REVERSE_CACHE_LIMIT))
  );
}

function touchMapEntry<T>(map: Map<string, CachedValue<T>>, key: string, value: CachedValue<T>) {
  map.delete(key);
  map.set(key, value);
}

function trimMap<T>(map: Map<string, CachedValue<T>>, limit: number) {
  while (map.size > limit) {
    const oldest = map.keys().next().value;
    if (!oldest) break;
    map.delete(oldest);
  }
}

function roundCoord(value: number) {
  return Number(value.toFixed(REVERSE_COORD_PRECISION));
}

function makeReverseCoordsKey(coords: Position) {
  return `${roundCoord(coords[0])},${roundCoord(coords[1])}`;
}

export function makeProximityBucket(position?: Position): string {
  if (!position || position[0] === -1 || position[1] === -1) return "none";
  const lng = Number(position[0].toFixed(2));
  const lat = Number(position[1].toFixed(2));
  return `${lng},${lat}`;
}

export function makeSearchQueryKey(query: string, proximity?: Position): string {
  return `${query.trim().toLowerCase()}|${makeProximityBucket(proximity)}`;
}

export async function getCachedSearchResults(
  query: string,
  proximity?: Position
): Promise<SearchResult[] | null> {
  await loadSearchCache();
  const key = makeSearchQueryKey(query, proximity);
  const cached = searchCache.get(key);
  if (!cached || !isFresh(cached.updatedAt)) return null;
  touchMapEntry(searchCache, key, cached);
  return cached.value;
}

export async function setCachedSearchResults(
  query: string,
  proximity: Position | undefined,
  results: SearchResult[]
): Promise<void> {
  await loadSearchCache();
  const key = makeSearchQueryKey(query, proximity);
  touchMapEntry(searchCache, key, { value: results, updatedAt: now() });
  trimMap(searchCache, SEARCH_CACHE_LIMIT);
  await persistSearchCache();
}

export async function getCachedReverseGeocode(coords: Position): Promise<PlaceLabel | null> {
  await loadReverseCache();
  const key = makeReverseCoordsKey(coords);
  const cached = reverseCache.get(key);
  if (!cached || !isFresh(cached.updatedAt)) return null;
  touchMapEntry(reverseCache, key, cached);
  return cached.value;
}

export async function setCachedReverseGeocode(
  coords: Position,
  label: PlaceLabel
): Promise<void> {
  await loadReverseCache();
  const key = makeReverseCoordsKey(coords);
  touchMapEntry(reverseCache, key, { value: label, updatedAt: now() });
  trimMap(reverseCache, REVERSE_CACHE_LIMIT);
  await persistReverseCache();
}

export async function reverseGeocodeWithCache(coords: Position): Promise<PlaceLabel | null> {
  const cached = await getCachedReverseGeocode(coords);
  if (cached) return cached;

  try {
    const url = "https://api.mapbox.com/search/geocode/v6/reverse";
    const res = await axios.get(url, {
      params: {
        access_token: MAPBOX_ACCESS_TOKEN,
        longitude: coords[0],
        latitude: coords[1],
      },
    });
    const feature = res.data?.features?.[0];
    const properties = feature?.properties ?? {};
    const name =
      properties.name_preferred ??
      properties.name ??
      properties.place_formatted ??
      feature?.place_name ??
      "";

    if (!name) {
      return null;
    }

    const label: PlaceLabel = {
      name,
      full_address: properties.full_address ?? properties.place_formatted ?? name,
    };
    await setCachedReverseGeocode(coords, label);
    return label;
  } catch {
    return null;
  }
}

export async function warmReverseGeocodeCacheFromHistory(entries: SearchHistoryEntry[]) {
  await loadReverseCache();
  let changed = false;

  for (const entry of entries) {
    if (!Array.isArray(entry.coords) || entry.coords.length < 2) continue;
    const label: PlaceLabel = {
      name: entry.name || entry.full_address,
      full_address: entry.full_address || entry.name,
    };
    if (!label.name && !label.full_address) continue;

    const key = makeReverseCoordsKey(entry.coords as Position);
    if (!reverseCache.has(key)) {
      reverseCache.set(key, { value: label, updatedAt: now() });
      changed = true;
    }
  }

  if (changed) {
    trimMap(reverseCache, REVERSE_CACHE_LIMIT);
    await persistReverseCache();
  }
}

export async function warmSearchCacheFromHistory(
  entries: SearchHistoryEntry[],
  proximity?: Position
) {
  await loadSearchCache();
  let changed = false;

  for (const entry of entries) {
    const query = (entry.name || "").trim();
    if (!query) continue;
    const key = makeSearchQueryKey(query, proximity);
    if (!searchCache.has(key)) {
      const value: SearchResult[] = [
        {
          id: `history:${query}:${entry.coords[0]},${entry.coords[1]}`,
          name: entry.name,
          full_address: entry.full_address,
          coords: entry.coords,
        },
      ];
      searchCache.set(key, { value, updatedAt: now() });
      changed = true;
    }
  }

  if (changed) {
    trimMap(searchCache, SEARCH_CACHE_LIMIT);
    await persistSearchCache();
  }
}

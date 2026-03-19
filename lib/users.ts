import firestore from "@react-native-firebase/firestore";
import type { FirebaseFirestoreTypes } from "@react-native-firebase/firestore";
import type { Position } from "./mapbox";

export interface SearchHistoryEntry {
  name: string;
  full_address: string;
  coords: Position;
}

export type UserSettings = {
  // Ride preferences
  default_ride_type?: "basic" | "comfort" | "xl";
  silent_only?: boolean;
  default_pickup_label?: string;
  default_pickup_coords?: Position | null;
  // Notifications
  ride_updates_push?: boolean;
  promotions_push?: boolean;
  // Accessibility & UI
  large_text?: boolean;
  high_contrast_map?: boolean;
  // Auth-related metadata
  last_email_change_at?: FirebaseFirestoreTypes.Timestamp | null;
};

type UserDoc = {
  verified?: boolean;
  recent_searches?: SearchHistoryEntry[];
  metadata?: {
    name?: string;
    rating?: number;
    rides_taken?: number;
    history?: SearchHistoryEntry[];
    pickup_history?: SearchHistoryEntry[];
    destination_history?: SearchHistoryEntry[];
    favourites?: SearchHistoryEntry[];
    silent_only?: boolean;
  };
  settings?: UserSettings;
} | undefined;

async function getUserDoc(uid: string): Promise<UserDoc> {
  const snap = await firestore().collection("users").doc(uid).get();
  return snap.data() as UserDoc;
}

function normalizeHistory(
  primary?: SearchHistoryEntry[] | null,
  legacy1?: SearchHistoryEntry[] | null,
  legacy2?: SearchHistoryEntry[] | null
): SearchHistoryEntry[] {
  return (primary ?? legacy1 ?? legacy2 ?? []) as SearchHistoryEntry[];
}

function dedupeAndLimit(
  entry: SearchHistoryEntry,
  existing: SearchHistoryEntry[],
  limit: number = 10
): SearchHistoryEntry[] {
  const filtered = existing.filter(
    (e) =>
      !(
        e.name === entry.name &&
        e.full_address === entry.full_address &&
        Array.isArray(e.coords) &&
        Array.isArray(entry.coords) &&
        e.coords[0] === entry.coords[0] &&
        e.coords[1] === entry.coords[1]
      )
  );
  return [entry, ...filtered].slice(0, limit);
}

export async function getSearchHistory(uid: string): Promise<SearchHistoryEntry[]> {
  const data = await getUserDoc(uid);

  if (!data) return [];

  // Prefer nested metadata.history; fall back to legacy top-level recent_searches if needed
  const history = data.metadata?.history ?? data.recent_searches;
  return (history as SearchHistoryEntry[]) ?? [];
}

export async function addToSearchHistory(uid: string, entry: SearchHistoryEntry): Promise<void> {
  // Legacy helper kept for backwards compatibility.
  // New code should prefer addToPickupHistory / addToDestinationHistory.
  await addToPickupHistory(uid, entry);
}

export async function getFavourites(uid: string): Promise<SearchHistoryEntry[]> {
  const data = await getUserDoc(uid);

  if (!data) return [];
  return (data.metadata?.favourites as SearchHistoryEntry[]) ?? [];
}

export async function toggleFavourite(
  uid: string,
  entry: SearchHistoryEntry
): Promise<SearchHistoryEntry[]> {
  const ref = firestore().collection("users").doc(uid);
  const data = await getUserDoc(uid);

  const existing: SearchHistoryEntry[] =
    (data?.metadata?.favourites as SearchHistoryEntry[]) ?? [];

  const sameLocation = (a: SearchHistoryEntry, b: SearchHistoryEntry) =>
    a.name === b.name &&
    a.full_address === b.full_address &&
    Array.isArray(a.coords) &&
    Array.isArray(b.coords) &&
    a.coords[0] === b.coords[0] &&
    a.coords[1] === b.coords[1];

  const exists = existing.some((e) => sameLocation(e, entry));
  const updated = exists
    ? existing.filter((e) => !sameLocation(e, entry))
    : [...existing, entry];

  await ref.set(
    {
      metadata: {
        ...(data?.metadata ?? {}),
        favourites: updated,
      },
    },
    { merge: true }
  );

  return updated;
}

export async function getPickupHistory(uid: string): Promise<SearchHistoryEntry[]> {
  const data = await getUserDoc(uid);

  if (!data) return [];

  const primary = data.metadata?.pickup_history as SearchHistoryEntry[] | undefined;
  const legacy = data.metadata?.history as SearchHistoryEntry[] | undefined;
  const legacyTop = data.recent_searches as SearchHistoryEntry[] | undefined;

  return normalizeHistory(primary, legacy, legacyTop);
}

export async function getDestinationHistory(uid: string): Promise<SearchHistoryEntry[]> {
  const data = await getUserDoc(uid);

  if (!data) return [];

  const primary = data.metadata?.destination_history as SearchHistoryEntry[] | undefined;
  const legacy = data.metadata?.history as SearchHistoryEntry[] | undefined;
  const legacyTop = data.recent_searches as SearchHistoryEntry[] | undefined;

  return normalizeHistory(primary, legacy, legacyTop);
}

export async function addToPickupHistory(
  uid: string,
  entry: SearchHistoryEntry
): Promise<void> {
  const ref = firestore().collection("users").doc(uid);
  const data = await getUserDoc(uid);

  const existing: SearchHistoryEntry[] = normalizeHistory(
    data?.metadata?.pickup_history as SearchHistoryEntry[] | undefined,
    data?.metadata?.history as SearchHistoryEntry[] | undefined,
    data?.recent_searches as SearchHistoryEntry[] | undefined
  );

  const updated = dedupeAndLimit(entry, existing, 10);

  await ref.set(
    {
      metadata: {
        ...(data?.metadata ?? {}),
        pickup_history: updated,
      },
    },
    { merge: true }
  );
}

export async function addToDestinationHistory(
  uid: string,
  entry: SearchHistoryEntry
): Promise<void> {
  const ref = firestore().collection("users").doc(uid);
  const data = await getUserDoc(uid);

  const existing: SearchHistoryEntry[] = normalizeHistory(
    data?.metadata?.destination_history as SearchHistoryEntry[] | undefined,
    data?.metadata?.history as SearchHistoryEntry[] | undefined,
    data?.recent_searches as SearchHistoryEntry[] | undefined
  );

  const updated = dedupeAndLimit(entry, existing, 10);

  await ref.set(
    {
      metadata: {
        ...(data?.metadata ?? {}),
        destination_history: updated,
      },
    },
    { merge: true }
  );
}

export async function getSilentOnlyDefault(uid: string): Promise<boolean> {
  const data = await getUserDoc(uid);
  if (!data) return false;
  return !!data.settings?.silent_only;
}

export async function getUserVerificationStatus(uid: string): Promise<boolean> {
  const data = await getUserDoc(uid);
  if (!data) return false;
  return data.verified === true;
}

export async function markUserVerified(uid: string): Promise<void> {
  await firestore().collection("users").doc(uid).set(
    {
      verified: true,
    },
    { merge: true }
  );
}

function normalizeUserSettings(
  raw?: UserSettings | null
): UserSettings {
  const base: UserSettings = raw ?? {};

  return {
    default_ride_type: base.default_ride_type ?? "basic",
    silent_only: base.silent_only ?? false,
    default_pickup_label: base.default_pickup_label ?? "",
    default_pickup_coords:
      Array.isArray(base.default_pickup_coords) &&
      base.default_pickup_coords.length === 2
        ? (base.default_pickup_coords as Position)
        : null,
    ride_updates_push:
      typeof base.ride_updates_push === "boolean"
        ? base.ride_updates_push
        : true,
    promotions_push:
      typeof base.promotions_push === "boolean"
        ? base.promotions_push
        : false,
    large_text:
      typeof base.large_text === "boolean" ? base.large_text : false,
    high_contrast_map:
      typeof base.high_contrast_map === "boolean"
        ? base.high_contrast_map
        : false,
    last_email_change_at:
      base.last_email_change_at ?? null,
  };
}

export async function getUserSettings(
  uid: string
): Promise<UserSettings> {
  const snap = await firestore()
    .collection("users")
    .doc(uid)
    .get();
  const data = snap.data() as UserDoc;
  return normalizeUserSettings(data?.settings);
}

export async function updateUserSettings(
  uid: string,
  partial: Partial<UserSettings>
): Promise<UserSettings> {
  const ref = firestore().collection("users").doc(uid);
  const snap = await ref.get();
  const data = snap.data() as UserDoc;
  const current = normalizeUserSettings(data?.settings);
  const merged: UserSettings = {
    ...current,
    ...partial,
  };

  await ref.set(
    {
      settings: merged,
    },
    { merge: true }
  );

  return merged;
}

export interface UserProfileMeta {
  name: string;
  rating: number;
  rides_taken: number;
}

export async function getUserProfileMeta(uid: string): Promise<UserProfileMeta> {
  const data = await getUserDoc(uid);

  const name = data?.metadata?.name?.trim() || "Rider";
  const ratingRaw = data?.metadata?.rating;
  const ridesRaw = data?.metadata?.rides_taken;

  const rating =
    typeof ratingRaw === "number" && !Number.isNaN(ratingRaw)
      ? ratingRaw
      : 5;
  const rides_taken =
    typeof ridesRaw === "number" && Number.isFinite(ridesRaw)
      ? ridesRaw
      : 0;

  return {
    name,
    rating,
    rides_taken,
  };
}

export async function setUserProfileName(
  uid: string,
  name: string
): Promise<UserProfileMeta> {
  const ref = firestore().collection("users").doc(uid);
  const data = await getUserDoc(uid);
  const trimmed = name.trim();

  await ref.set(
    {
      metadata: {
        ...(data?.metadata ?? {}),
        name: trimmed,
      },
    },
    { merge: true }
  );

  return getUserProfileMeta(uid);
}

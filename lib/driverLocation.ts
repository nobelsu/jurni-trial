import { getApp } from "@react-native-firebase/app";
import { getDatabase, ref, onValue } from "@react-native-firebase/database";
import type { Position } from "./mapbox";

/** Regional RTDB instance for jurni-71656 (must match GoogleService-Info / google-services). */
const JURNI_DATABASE_URL =
  "https://jurni-71656-default-rtdb.europe-west1.firebasedatabase.app";

function getRtdb() {
  const app = getApp();
  return getDatabase(app, app.options.databaseURL ?? JURNI_DATABASE_URL);
}

export interface DriverLocationUpdate {
  lng: number;
  lat: number;
}

function toFiniteNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  return null;
}

/**
 * Parses lat/lng from RTDB driver location payloads. Supports top-level or
 * nested `location`, and `lat`/`lng` or `latitude`/`longitude` field names.
 */
export function parseDriverLocationPayload(
  value: unknown
): DriverLocationUpdate | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const root = value as Record<string, unknown>;
  const nested =
    root.location && typeof root.location === "object"
      ? (root.location as Record<string, unknown>)
      : null;

  const sources: Record<string, unknown>[] = nested ? [root, nested] : [root];

  for (const source of sources) {
    const lat = toFiniteNumber(source.lat ?? source.latitude);
    const lng = toFiniteNumber(source.lng ?? source.longitude);
    if (lat !== null && lng !== null) {
      return { lat, lng };
    }
  }

  return null;
}

/**
 * Subscribes to live updates for a driver's location stored at
 * `driverLocations/{driverId}` in Firebase Realtime Database. The callback is
 * only invoked when both `lat` and `lng` are finite numbers.
 *
 * Returns a function that can be called to remove the subscription.
 */
export function subscribeDriverLocation(
  driverId: string,
  onUpdate: (location: DriverLocationUpdate) => void,
  onError?: (error: Error) => void
): () => void {
  if (!driverId) {
    return () => {};
  }

  const db = getRtdb();
  const driverRef = ref(db, `driverLocations/${driverId}`);
  let loggedFirstRead = false;

  const unsubscribe = onValue(
    driverRef,
    (snapshot) => {
      const parsed = parseDriverLocationPayload(snapshot.val());
      if (!parsed) {
        return;
      }
      if (__DEV__ && !loggedFirstRead) {
        loggedFirstRead = true;
        console.log(
          `[driverLocation] subscribed driverLocations/${driverId}`,
          parsed
        );
      }
      onUpdate(parsed);
    },
    (error) => {
      const err =
        error instanceof Error ? error : new Error(String(error ?? "unknown"));
      console.log("Failed to subscribe to driver location", err);
      onError?.(err);
    }
  );

  return unsubscribe;
}

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/**
 * Computes the great-circle distance in meters between two `[lng, lat]`
 * positions using the haversine formula.
 */
export function haversineMeters(a: Position, b: Position): number {
  const earthRadiusMeters = 6371000;
  const lat1 = a[1];
  const lng1 = a[0];
  const lat2 = b[1];
  const lng2 = b[0];

  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);
  const sinDLat = Math.sin(dLat / 2);
  const sinDLng = Math.sin(dLng / 2);
  const h =
    sinDLat * sinDLat +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      sinDLng *
      sinDLng;
  const c = 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
  return earthRadiusMeters * c;
}

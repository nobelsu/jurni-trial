import { getDatabase, ref, onValue } from "@react-native-firebase/database";
import type { Position } from "./mapbox";

export interface DriverLocationUpdate {
  lng: number;
  lat: number;
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
  onUpdate: (location: DriverLocationUpdate) => void
): () => void {
  if (!driverId) {
    return () => {};
  }

  const db = getDatabase();
  const driverRef = ref(db, `driverLocations/${driverId}`);

  const unsubscribe = onValue(
    driverRef,
    (snapshot) => {
      const value = snapshot.val();
      if (!value || typeof value !== "object") {
        return;
      }
      const lat = (value as { lat?: unknown }).lat;
      const lng = (value as { lng?: unknown }).lng;
      if (
        typeof lat === "number" &&
        Number.isFinite(lat) &&
        typeof lng === "number" &&
        Number.isFinite(lng)
      ) {
        onUpdate({ lat, lng });
      }
    },
    (error) => {
      console.log("Failed to subscribe to driver location", error);
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

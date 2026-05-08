import {onDocumentCreated} from "firebase-functions/v2/firestore";
import * as logger from "firebase-functions/logger";
import * as admin from "firebase-admin";

if (admin.apps.length === 0) {
  admin.initializeApp();
}

interface RideDoc {
  status?: string;
  rider_id?: string;
  type_id?: string;
  female_driver_preferred?: boolean;
  created_at?: unknown;
  pickup_geopoint?: {
    latitude?: unknown;
    longitude?: unknown;
  } | null;
}

interface DriverLocationRecord {
  lat?: unknown;
  lng?: unknown;
  status?: unknown;
  rideRequestQueue?: unknown;
}

interface DriverCandidate {
  driverId: string;
  lat: number;
  lng: number;
  distanceMeters: number;
}

/**
 * Converts an unknown value to a finite number when valid.
 * @param {unknown} value Value to validate.
 * @return {number | null} Finite numeric value or null when invalid.
 */
function toFiniteNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

/**
 * Converts degrees to radians for trigonometric distance calculations.
 * @param {number} degrees Value in degrees.
 * @return {number} Equivalent value in radians.
 */
function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/**
 * Computes straight-line distance in meters between two coordinates.
 * @param {number} lat1 Latitude of first point.
 * @param {number} lng1 Longitude of first point.
 * @param {number} lat2 Latitude of second point.
 * @param {number} lng2 Longitude of second point.
 * @return {number} Distance in meters.
 */
function haversineMeters(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const earthRadiusMeters = 6371000;
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadiusMeters * c;
}

export const onPendingRideCreated = onDocumentCreated("rides/{rideId}", async (event) => {
  const snapshot = event.data;
  if (!snapshot) {
    logger.warn("Ride create trigger fired without document snapshot", {
      rideId: event.params.rideId,
    });
    return;
  }

  const ride = snapshot.data() as RideDoc;
  const rideId = event.params.rideId;

  if (ride.status !== "PENDING") {
    logger.info("Skipping created ride with non-pending status", {
      rideId,
      status: ride.status ?? null,
    });
    return;
  }

  const pickupLat = toFiniteNumber(ride.pickup_geopoint?.latitude);
  const pickupLng = toFiniteNumber(ride.pickup_geopoint?.longitude);
  if (pickupLat === null || pickupLng === null) {
    logger.warn("Skipping pending ride due to invalid pickup_geopoint", {
      rideId,
      pickup_geopoint: ride.pickup_geopoint ?? null,
    });
    return;
  }

  logger.info("Processing pending ride for nearest drivers", {
    rideId,
    rider_id: ride.rider_id ?? null,
    type_id: ride.type_id ?? null,
    female_driver_preferred: ride.female_driver_preferred ?? false,
    created_at: ride.created_at ?? null,
    pickup_lat: pickupLat,
    pickup_lng: pickupLng,
  });

  const driverLocationsRef = admin.database().ref("driverLocations");
  const driverLocationsSnapshot = await driverLocationsRef.get();
  const driverLocationsValue = driverLocationsSnapshot.val();

  if (!driverLocationsValue || typeof driverLocationsValue !== "object") {
    logger.info("No driver locations available for ride enqueue", {rideId});
    return;
  }

  const candidates: DriverCandidate[] = [];
  for (const [driverId, rawDriverValue] of Object.entries(driverLocationsValue)) {
    if (!rawDriverValue || typeof rawDriverValue !== "object") {
      continue;
    }

    const driver = rawDriverValue as DriverLocationRecord;
    if (driver.status !== "online") {
      continue;
    }

    const driverLat = toFiniteNumber(driver.lat);
    const driverLng = toFiniteNumber(driver.lng);
    if (driverLat === null || driverLng === null) {
      continue;
    }

    candidates.push({
      driverId,
      lat: driverLat,
      lng: driverLng,
      distanceMeters: haversineMeters(pickupLat, pickupLng, driverLat, driverLng),
    });
  }

  if (candidates.length === 0) {
    logger.info("No eligible online drivers found for pending ride", {rideId});
    return;
  }

  const nearestDrivers = candidates
    .sort((a, b) => a.distanceMeters - b.distanceMeters)
    .slice(0, 3);

  await Promise.all(
    nearestDrivers.map(async (driver) => {
      const queueRef = driverLocationsRef.child(`${driver.driverId}/rideRequestQueue`);
      await queueRef.transaction((currentQueue: unknown) => {
        const queue = Array.isArray(currentQueue) ? [...currentQueue] : [];
        if (!queue.includes(rideId)) {
          queue.push(rideId);
        }
        return queue;
      });
    }),
  );

  logger.info("Enqueued ride for nearest drivers", {
    rideId,
    availableOnlineDrivers: candidates.length,
    selectedDriverIds: nearestDrivers.map((driver) => driver.driverId),
    selectedDistancesMeters: nearestDrivers.map((driver) =>
      Math.round(driver.distanceMeters),
    ),
  });
});

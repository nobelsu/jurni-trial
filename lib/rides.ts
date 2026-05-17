import type { FirebaseFirestoreTypes } from "@react-native-firebase/firestore";
import type { RideTypeId } from "./cost";
import type { Position } from "./mapbox";
import { rideTypeMetadata } from "../constants/MockData";

export const RIDE_STATUS = {
  PENDING: "PENDING",
  ACCEPTED: "ACCEPTED",
  IN_PROGRESS: "IN_PROGRESS",
  COMPLETED: "COMPLETED",
  CANCELLED: "CANCELLED",
} as const;

export type RideCancelledBy = "rider" | "driver";

export type RideStatus = (typeof RIDE_STATUS)[keyof typeof RIDE_STATUS];

export type DriverRouteStatus =
  | "waiting_location"
  | "loading"
  | "ready"
  | "error";

/** Firestore ride document shape (rides collection) */
export interface Ride {
  id: string;
  rider_id: string;
  type_id: RideTypeId;
  price: number;
  status: string;
  /** Two-digit code the driver enters to start the trip */
  secret: string | null;
  driver_id: string | null;
  created_at: FirebaseFirestoreTypes.Timestamp | null;
  started_at: FirebaseFirestoreTypes.Timestamp | null;
  accepted_at: FirebaseFirestoreTypes.Timestamp | null;
  ended_at: FirebaseFirestoreTypes.Timestamp | null;
  pickup: string | null;
  destination: string | null;
  pickup_geopoint: FirebaseFirestoreTypes.GeoPoint | null;
  destination_geopoint: FirebaseFirestoreTypes.GeoPoint | null;
  /** Mapbox-style [longitude, latitude] points along the driving route */
  route_coordinates: Position[] | null;
  female_driver_preferred?: boolean;
  driver_rating?: number;
  driver_rated_at?: FirebaseFirestoreTypes.Timestamp | null;
}

/** Normalize `route_coordinates` from Firestore (array of lng/lat pairs). */
export function parseRouteCoordinates(raw: unknown): Position[] | null {
  if (!Array.isArray(raw) || raw.length < 2) return null;
  const out: Position[] = [];
  for (const item of raw) {
    if (
      Array.isArray(item) &&
      item.length >= 2 &&
      typeof item[0] === "number" &&
      typeof item[1] === "number" &&
      Number.isFinite(item[0]) &&
      Number.isFinite(item[1])
    ) {
      out.push([item[0], item[1]]);
    } else {
      return null;
    }
  }
  return out.length >= 2 ? out : null;
}

/** Display name for a ride type id (e.g. "Jurni Go") */
export function getRideTypeDisplayName(typeId: RideTypeId): string {
  return rideTypeMetadata[typeId]?.name ?? typeId;
}

/** Random two-digit ride start code (00–99). */
export function generateRideSecret(): string {
  return String(Math.floor(Math.random() * 100)).padStart(2, "0");
}

/** Parse a ride secret from user input; returns null if invalid. */
export function normalizeRideSecret(input: string): string | null {
  const digits = input.replace(/\D/g, "");
  if (digits.length === 0) return null;
  const lastTwo = digits.slice(-2);
  return lastTwo.padStart(2, "0");
}

/** Parse `secret` from a Firestore ride document field. */
export function parseRideSecret(raw: unknown): string | null {
  return typeof raw === "string" && /^\d{2}$/.test(raw) ? raw : null;
}

/** Parse a Firestore GeoPoint into a Mapbox [lng, lat] position. */
export function parseGeopointToPosition(
  geopoint: FirebaseFirestoreTypes.GeoPoint | null | undefined
): Position | null {
  if (
    !geopoint ||
    typeof geopoint.longitude !== "number" ||
    typeof geopoint.latitude !== "number" ||
    !Number.isFinite(geopoint.longitude) ||
    !Number.isFinite(geopoint.latitude)
  ) {
    return null;
  }
  return [geopoint.longitude, geopoint.latitude];
}

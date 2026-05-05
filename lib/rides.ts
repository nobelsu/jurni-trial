import type { FirebaseFirestoreTypes } from "@react-native-firebase/firestore";
import type { RideTypeId } from "./cost";
import type { Position } from "./mapbox";
import { rideTypeMetadata } from "../constants/MockData";

/** Firestore ride document shape (rides collection) */
export interface Ride {
  id: string;
  rider_id: string;
  type_id: RideTypeId;
  price: number;
  status: string;
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

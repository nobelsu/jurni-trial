import type { FirebaseFirestoreTypes } from "@react-native-firebase/firestore";
import type { RideTypeId } from "./cost";
import { rideTypeMetadata } from "../constants/MockData";

/** Firestore ride document shape (rides collection) */
export interface Ride {
  id: string;
  rider_id: string;
  type_id: RideTypeId;
  price: number;
  status: string;
  driver_id: string;
  created_at: FirebaseFirestoreTypes.Timestamp | null;
  started_at: FirebaseFirestoreTypes.Timestamp | null;
  accepted_at: FirebaseFirestoreTypes.Timestamp | null;
  ended_at: FirebaseFirestoreTypes.Timestamp | null;
  pickup: string | null;
  destination: string | null;
  pickup_geopoint: FirebaseFirestoreTypes.GeoPoint | null;
  destination_geopoint: FirebaseFirestoreTypes.GeoPoint | null;
  female_driver_preferred?: boolean;
  driver_rating?: number;
  driver_rated_at?: FirebaseFirestoreTypes.Timestamp | null;
}

/** Display name for a ride type id (e.g. "Jurni Go") */
export function getRideTypeDisplayName(typeId: RideTypeId): string {
  return rideTypeMetadata[typeId]?.name ?? typeId;
}

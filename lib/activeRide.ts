import firestore from "@react-native-firebase/firestore";
import type { RideTypeId } from "./cost";
import type { Position } from "./mapbox";
import {
  clearUserActiveRideId,
  getUserActiveRideId,
} from "./users";
import {
  parseGeopointToPosition,
  parseRideSecret,
  RIDE_STATUS,
} from "./rides";

const RIDE_TYPE_IDS: RideTypeId[] = ["basic", "plus", "exec", "xl", "access"];

function parseRideTypeId(raw: unknown): RideTypeId | undefined {
  return typeof raw === "string" && RIDE_TYPE_IDS.includes(raw as RideTypeId)
    ? (raw as RideTypeId)
    : undefined;
}

function toAcceptedAtLabel(rawAcceptedAt: unknown): string | null {
  if (!rawAcceptedAt) return null;
  const acceptedDate =
    typeof (rawAcceptedAt as { toDate?: () => Date }).toDate === "function"
      ? (rawAcceptedAt as { toDate: () => Date }).toDate()
      : rawAcceptedAt instanceof Date
        ? rawAcceptedAt
        : null;
  if (!acceptedDate) return null;
  return acceptedDate.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
}

export type RestoredActiveRideSession = {
  restored: true;
  rideId: string;
  phase: 4 | 5;
  pickupLabel: string | null;
  destinationLabel: string | null;
  pickupCoords: Position | null;
  destinationCoords: Position | null;
  acceptedAtLabel: string | null;
  secret: string | null;
  price: number | null;
  typeId: RideTypeId | undefined;
  driverId: string | null;
  tripStarted: boolean;
  tripEnded: boolean;
};

export type RestoreActiveRideResult =
  | RestoredActiveRideSession
  | { restored: false };

function phaseFromRideData(ride: Record<string, unknown>): 4 | 5 | null {
  const status = ride.status;
  const hasEnded =
    ride.ended_at != null || status === RIDE_STATUS.COMPLETED;
  const isInProgress =
    status === RIDE_STATUS.IN_PROGRESS ||
    (ride.started_at != null && !hasEnded);

  if (hasEnded) return 5;
  if (status === RIDE_STATUS.ACCEPTED || isInProgress) return 4;
  return null;
}

/**
 * Reads the rider's active_ride_id and hydrates map state after a driver has accepted.
 * PENDING rides are not restored (active_ride_id is only set on accept).
 */
export async function restoreActiveRideSession(
  uid: string
): Promise<RestoreActiveRideResult> {
  if (!uid) return { restored: false };

  const activeRideId = await getUserActiveRideId(uid);
  if (!activeRideId) return { restored: false };

  const snap = await firestore().collection("rides").doc(activeRideId).get();

  if (!snap.exists()) {
    await clearUserActiveRideId(uid);
    return { restored: false };
  }

  const ride = snap.data();
  if (!ride) {
    await clearUserActiveRideId(uid);
    return { restored: false };
  }

  const riderId =
    typeof ride.rider_id === "string" ? ride.rider_id : null;
  if (riderId !== uid) {
    await clearUserActiveRideId(uid);
    return { restored: false };
  }

  const status = ride.status;
  const driverId =
    typeof ride.driver_id === "string" && ride.driver_id.length > 0
      ? ride.driver_id
      : null;

  if (
    status === RIDE_STATUS.CANCELLED ||
    status === RIDE_STATUS.PENDING ||
    !driverId
  ) {
    await clearUserActiveRideId(uid);
    return { restored: false };
  }

  const phase = phaseFromRideData(ride as Record<string, unknown>);
  if (phase == null) {
    await clearUserActiveRideId(uid);
    return { restored: false };
  }
  const hasEnded =
    ride.ended_at != null || status === RIDE_STATUS.COMPLETED;
  const isInProgress =
    status === RIDE_STATUS.IN_PROGRESS ||
    (ride.started_at != null && !hasEnded);
  const ridePrice =
    typeof ride.price === "number" && Number.isFinite(ride.price)
      ? ride.price
      : null;

  return {
    restored: true,
    rideId: snap.id,
    phase,
    pickupLabel:
      typeof ride.pickup === "string" && ride.pickup.length > 0
        ? ride.pickup
        : null,
    destinationLabel:
      typeof ride.destination === "string" && ride.destination.length > 0
        ? ride.destination
        : null,
    pickupCoords: parseGeopointToPosition(ride.pickup_geopoint),
    destinationCoords: parseGeopointToPosition(ride.destination_geopoint),
    acceptedAtLabel: toAcceptedAtLabel(ride.accepted_at),
    secret: parseRideSecret(ride.secret),
    price: ridePrice,
    typeId: parseRideTypeId(ride.type_id),
    driverId,
    tripStarted: isInProgress,
    tripEnded: hasEnded,
  };
}

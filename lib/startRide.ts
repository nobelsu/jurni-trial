import firestore from "@react-native-firebase/firestore";
import { normalizeRideSecret, parseRideSecret, RIDE_STATUS } from "./rides";

export type StartRideErrorCode =
  | "ride_not_found"
  | "invalid_status"
  | "not_assigned_driver"
  | "already_started"
  | "invalid_secret";

export type StartRideResult =
  | { ok: true }
  | { ok: false; code: StartRideErrorCode };

export interface StartRideParams {
  rideId: string;
  driverId: string;
  secret: string;
}

/**
 * Validates the trip code and starts the ride (sets started_at, IN_PROGRESS).
 * Intended for the driver app; requires matching driver_id on the ride doc.
 *
 * Production should enforce this via Firestore security rules.
 */
export async function startRide({
  rideId,
  driverId,
  secret,
}: StartRideParams): Promise<StartRideResult> {
  const normalizedSecret = normalizeRideSecret(secret);
  if (!normalizedSecret) {
    return { ok: false, code: "invalid_secret" };
  }

  const rideRef = firestore().collection("rides").doc(rideId);

  try {
    return await firestore().runTransaction(async (transaction) => {
      const snapshot = await transaction.get(rideRef);
      if (!snapshot.exists) {
        return { ok: false, code: "ride_not_found" };
      }

      const ride = snapshot.data();
      if (!ride) {
        return { ok: false, code: "ride_not_found" };
      }

      if (ride.status !== RIDE_STATUS.ACCEPTED) {
        return { ok: false, code: "invalid_status" };
      }

      if (ride.driver_id !== driverId) {
        return { ok: false, code: "not_assigned_driver" };
      }

      if (ride.started_at != null) {
        return { ok: false, code: "already_started" };
      }

      const rideSecret = parseRideSecret(ride.secret);
      if (!rideSecret || rideSecret !== normalizedSecret) {
        return { ok: false, code: "invalid_secret" };
      }

      transaction.update(rideRef, {
        started_at: firestore.FieldValue.serverTimestamp(),
        status: RIDE_STATUS.IN_PROGRESS,
      });

      return { ok: true };
    });
  } catch {
    return { ok: false, code: "ride_not_found" };
  }
}

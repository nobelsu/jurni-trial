import firestore from "@react-native-firebase/firestore";
import { RIDE_STATUS } from "./rides";

export type EndRideErrorCode =
  | "ride_not_found"
  | "invalid_status"
  | "not_assigned_driver"
  | "not_started"
  | "already_ended";

export type EndRideResult = { ok: true } | { ok: false; code: EndRideErrorCode };

export interface EndRideParams {
  rideId: string;
  driverId: string;
}

/**
 * Ends an in-progress ride (sets ended_at, COMPLETED).
 * Intended for the driver app; requires matching driver_id on the ride doc.
 */
export async function endRide({
  rideId,
  driverId,
}: EndRideParams): Promise<EndRideResult> {
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

      if (ride.status !== RIDE_STATUS.IN_PROGRESS) {
        return { ok: false, code: "invalid_status" };
      }

      if (ride.driver_id !== driverId) {
        return { ok: false, code: "not_assigned_driver" };
      }

      if (ride.started_at == null) {
        return { ok: false, code: "not_started" };
      }

      if (ride.ended_at != null) {
        return { ok: false, code: "already_ended" };
      }

      transaction.update(rideRef, {
        ended_at: firestore.FieldValue.serverTimestamp(),
        status: RIDE_STATUS.COMPLETED,
      });

      return { ok: true };
    });
  } catch {
    return { ok: false, code: "ride_not_found" };
  }
}

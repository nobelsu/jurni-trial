import firestore from "@react-native-firebase/firestore";
import { RIDE_STATUS, type RideCancelledBy } from "./rides";
import { clearUserActiveRideId } from "./users";

/**
 * Marks an active ride as cancelled by the rider.
 */
export async function cancelRideAsRider(rideId: string): Promise<void> {
  if (!rideId) {
    throw new Error("Missing ride id");
  }
  const rideRef = firestore().collection("rides").doc(rideId);
  const snap = await rideRef.get();
  if (!snap.exists()) {
    throw new Error("Ride not found");
  }
  const data = snap.data();
  const status = data?.status;
  if (
    status === RIDE_STATUS.COMPLETED ||
    status === RIDE_STATUS.CANCELLED
  ) {
    return;
  }
  await rideRef.update({
    status: RIDE_STATUS.CANCELLED,
    cancelled_at: firestore.FieldValue.serverTimestamp(),
    cancelled_by: "rider" satisfies RideCancelledBy,
  });

  const riderId =
    typeof data?.rider_id === "string" ? data.rider_id : null;
  if (riderId) {
    await clearUserActiveRideId(riderId);
  }
}

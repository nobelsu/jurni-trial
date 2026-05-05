import {onDocumentCreated} from "firebase-functions/v2/firestore";
import * as logger from "firebase-functions/logger";

interface RideDoc {
  status?: string;
  rider_id?: string;
  type_id?: string;
  female_driver_preferred?: boolean;
  created_at?: unknown;
}

export const onPendingRideCreated = onDocumentCreated("rides/{rideId}", (event) => {
  const snapshot = event.data;
  if (!snapshot) {
    logger.warn("Ride create trigger fired without document snapshot", {
      rideId: event.params.rideId,
    });
    return;
  }

  const ride = snapshot.data() as RideDoc;

  if (ride.status !== "PENDING") {
    logger.info("Skipping created ride with non-pending status", {
      rideId: event.params.rideId,
      status: ride.status ?? null,
    });
    return;
  }

  logger.info("New pending ride created", {
    rideId: event.params.rideId,
    rider_id: ride.rider_id ?? null,
    type_id: ride.type_id ?? null,
    female_driver_preferred: ride.female_driver_preferred ?? false,
    created_at: ride.created_at ?? null,
  });
});

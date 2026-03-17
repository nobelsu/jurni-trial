import firestore, {
  FirebaseFirestoreTypes,
} from "@react-native-firebase/firestore";

export interface DriverAggregate {
  rating_count: number;
  rating_sum: number;
  avg_rating?: number;
}

export async function setOrUpdateRideRating(
  rideId: string,
  driverId: string,
  newRating: number
): Promise<void> {
  if (!driverId || !rideId) return;
  if (newRating < 1 || newRating > 5) return;

  const db = firestore();
  const rideRef = db.collection("rides").doc(rideId);
  const driverRef = db.collection("drivers").doc(driverId);

  await db.runTransaction(async (tx) => {
    const rideSnap = await tx.get(rideRef);
    if (!rideSnap.exists) {
      throw new Error("Ride not found");
    }

    const rideData = rideSnap.data() as {
      driver_rating?: number;
      driver_rated_at?: FirebaseFirestoreTypes.Timestamp | null;
    };

    const previousRating =
      typeof rideData.driver_rating === "number"
        ? rideData.driver_rating
        : undefined;

    // Update ride document with new rating
    tx.update(rideRef, {
      driver_rating: newRating,
      driver_rated_at: firestore.FieldValue.serverTimestamp(),
    });

    const driverSnap = await tx.get(driverRef);

    let rating_count = 0;
    let rating_sum = 0;

    if (driverSnap.exists) {
      const d = driverSnap.data() as Partial<DriverAggregate>;
      rating_count = typeof d.rating_count === "number" ? d.rating_count : 0;
      rating_sum = typeof d.rating_sum === "number" ? d.rating_sum : 0;
    }

    if (previousRating == null) {
      rating_count += 1;
      rating_sum += newRating;
    } else {
      rating_sum += newRating - previousRating;
    }

    const avg_rating =
      rating_count > 0 ? rating_sum / Math.max(rating_count, 1) : 0;

    tx.set(
      driverRef,
      {
        rating_count,
        rating_sum,
        avg_rating,
      },
      { merge: true }
    );
  });
}


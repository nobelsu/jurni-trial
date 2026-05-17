import firestore from "@react-native-firebase/firestore";
import { DRIVERS_COLLECTION } from "./registerDriver";

export interface DriverProfile {
  name: string;
  rating: number | null;
  vehicleLabel: string;
  phone: string | null;
}

function formatVehicleLabel(vehicle: unknown): string {
  if (!vehicle || typeof vehicle !== "object") {
    return "Vehicle details coming soon";
  }
  const v = vehicle as Record<string, unknown>;
  const parts: string[] = [];
  if (typeof v.make === "string" && v.make.trim()) {
    parts.push(v.make.trim());
  }
  if (typeof v.model === "string" && v.model.trim()) {
    parts.push(v.model.trim());
  }
  const color =
    typeof v.color === "string" && v.color.trim() ? v.color.trim() : null;
  const plate =
    typeof v.plate === "string" && v.plate.trim()
      ? v.plate.trim()
      : typeof v.licensePlate === "string" && v.licensePlate.trim()
        ? v.licensePlate.trim()
        : null;
  if (parts.length === 0 && !plate) {
    return "Vehicle details coming soon";
  }
  const vehicleLine = parts.join(" ");
  if (plate) {
    return color ? `${vehicleLine} · ${color} · ${plate}` : `${vehicleLine} · ${plate}`;
  }
  return color ? `${vehicleLine} · ${color}` : vehicleLine;
}

function parseDriverProfile(data: Record<string, unknown> | undefined): DriverProfile {
  if (!data) {
    return {
      name: "Your driver",
      rating: null,
      vehicleLabel: "Vehicle details coming soon",
      phone: null,
    };
  }
  const profile =
    data.profile && typeof data.profile === "object"
      ? (data.profile as Record<string, unknown>)
      : null;
  const driver =
    data.driver && typeof data.driver === "object"
      ? (data.driver as Record<string, unknown>)
      : null;

  const name =
    typeof profile?.name === "string" && profile.name.trim()
      ? profile.name.trim()
      : "Your driver";

  let rating: number | null = null;
  if (typeof data.avg_rating === "number" && Number.isFinite(data.avg_rating)) {
    rating = data.avg_rating;
  } else if (
    typeof driver?.ratingAvg === "number" &&
    Number.isFinite(driver.ratingAvg)
  ) {
    rating = driver.ratingAvg;
  }

  const phone =
    typeof profile?.phone === "string" && profile.phone.trim()
      ? profile.phone.trim()
      : null;

  return {
    name,
    rating,
    vehicleLabel: formatVehicleLabel(driver?.vehicle),
    phone,
  };
}

/**
 * Subscribes to driver profile updates from Firestore.
 */
export function subscribeDriverProfile(
  driverId: string,
  onProfile: (profile: DriverProfile) => void
): () => void {
  if (!driverId) {
    onProfile(parseDriverProfile(undefined));
    return () => {};
  }
  return firestore()
    .collection(DRIVERS_COLLECTION)
    .doc(driverId)
    .onSnapshot(
      (snapshot) => {
        onProfile(
          parseDriverProfile(
            snapshot.exists() ? (snapshot.data() as Record<string, unknown>) : undefined
          )
        );
      },
      () => {
        onProfile(parseDriverProfile(undefined));
      }
    );
}

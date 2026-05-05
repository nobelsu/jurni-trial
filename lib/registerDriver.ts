import firestore from "@react-native-firebase/firestore";

export type DriverGender =
  | "male"
  | "female"
  | "non_binary"
  | "prefer_not_to_say";

export const DRIVERS_COLLECTION = "drivers";

export function buildInitialDriverDocument(input: {
  name: string;
  gender: DriverGender;
  email: string;
}) {
  return {
    verified: false,
    createdAt: firestore.FieldValue.serverTimestamp(),
    updatedAt: firestore.FieldValue.serverTimestamp(),
    profile: {
      name: input.name,
      gender: input.gender,
      email: input.email,
    },
    driver: {
      status: "offline" as const,
      ratingAvg: 5,
      tripsCompleted: 0,
      onboardingComplete: false,
      vehicle: null,
    },
    settings: {
      tripOffersPush: true,
      earningsAlertsPush: true,
      promotionsPush: false,
      largeText: false,
      highContrastMap: false,
      lastEmailChangeAt: null,
    },
  };
}

export async function saveInitialDriverDocument(
  uid: string,
  input: { name: string; gender: DriverGender; email: string }
): Promise<void> {
  if (!uid) throw new Error("Missing driver uid");
  await firestore()
    .collection(DRIVERS_COLLECTION)
    .doc(uid)
    .set(buildInitialDriverDocument(input));
}

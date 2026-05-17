import { useMemo, useState } from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { faStar } from "@fortawesome/free-solid-svg-icons/faStar";
import { Colors } from "../constants/Colors";
import StyleDefault from "../constants/DefaultStyles";
import type { RideTypeId } from "../lib/cost";
import { getRideTypeDisplayName } from "../lib/rides";
import { setOrUpdateRideRating } from "../lib/drivers";
import DriverCard from "./DriverCard";

interface TripCompleteProps {
  rideId: string;
  driverId: string | null;
  destinationLabel?: string | null;
  price?: number;
  typeId?: RideTypeId;
  driverName?: string;
  driverRating?: number | null;
  vehicleDescription?: string;
  onDone: () => void;
}

export default function TripComplete({
  rideId,
  driverId,
  destinationLabel,
  price,
  typeId,
  driverName = "Your driver",
  driverRating = null,
  vehicleDescription = "Vehicle details coming soon",
  onDone,
}: TripCompleteProps) {
  const colorScheme = useColorScheme();
  const themeKey: keyof typeof Colors = colorScheme === "dark" ? "dark" : "light";
  const theme = Colors[themeKey];
  const defaultStyles = StyleDefault({ colorScheme });

  const [userRating, setUserRating] = useState<number | null>(null);
  const [submittingRating, setSubmittingRating] = useState(false);
  const [ratingStatus, setRatingStatus] = useState<string | null>(null);

  const rideTypeName = typeId ? getRideTypeDisplayName(typeId) : null;
  const priceLabel =
    typeof price === "number" && Number.isFinite(price) ? `£${price.toFixed(2)}` : "—";

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          paddingHorizontal: 20,
          paddingTop: 4,
          paddingBottom: 28,
          backgroundColor: theme.bgDark,
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
        },
        title: {
          ...defaultStyles.title,
          textAlign: "left",
          marginBottom: 4,
        },
        subtitle: {
          fontFamily: "Outfit_400Regular",
          fontSize: 15,
          lineHeight: 22,
          color: theme.textMuted,
          textAlign: "left",
          marginBottom: 16,
        },
        driverSection: {
          borderRadius: 14,
          padding: 14,
          backgroundColor: theme.bg,
          marginBottom: 12,
        },
        receiptCard: {
          borderRadius: 14,
          paddingHorizontal: 14,
          paddingVertical: 14,
          backgroundColor: theme.bg,
          marginBottom: 12,
          gap: 10,
        },
        receiptRow: {
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 12,
        },
        receiptLabel: {
          fontFamily: "Outfit_500Medium",
          fontSize: 12,
          color: theme.textDull,
          textTransform: "uppercase",
          letterSpacing: 1.2,
        },
        receiptValue: {
          fontFamily: "Outfit_500Medium",
          fontSize: 15,
          color: theme.text,
          flexShrink: 1,
          textAlign: "right",
        },
        fareValue: {
          fontFamily: "Outfit_600SemiBold",
          fontSize: 22,
          color: theme.text,
        },
        ratingSection: {
          borderRadius: 14,
          padding: 14,
          backgroundColor: theme.bg,
          marginBottom: 16,
          gap: 10,
        },
        starsRow: {
          flexDirection: "row",
          justifyContent: "center",
          gap: 12,
        },
        ratingHelper: {
          fontFamily: "Outfit_400Regular",
          fontSize: 13,
          color: theme.textMuted,
          textAlign: "center",
        },
        doneButton: {
          width: "100%",
          height: 50,
          borderRadius: 10,
          backgroundColor: theme.primary,
          justifyContent: "center",
          alignItems: "center",
        },
        doneButtonText: {
          fontFamily: "Outfit_500Medium",
          fontSize: 18,
          color: colorScheme === "light" ? Colors.light.bgDark : Colors.light.bgLight,
        },
      }),
    [
      colorScheme,
      defaultStyles.title,
      theme.bg,
      theme.bgDark,
      theme.primary,
      theme.text,
      theme.textDull,
      theme.textMuted,
    ]
  );

  const handleRateDriver = async (rating: number) => {
    if (!driverId || submittingRating) {
      return;
    }
    setSubmittingRating(true);
    setRatingStatus(null);
    try {
      await setOrUpdateRideRating(rideId, driverId, rating);
      setUserRating(rating);
      setRatingStatus("Thanks for rating your driver.");
    } catch {
      setRatingStatus("Failed to submit rating. Please try again.");
    } finally {
      setSubmittingRating(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>You&apos;ve arrived</Text>
      <Text style={styles.subtitle} numberOfLines={2}>
        {destinationLabel || "Thanks for riding with Jurni."}
      </Text>

      <View style={styles.driverSection}>
        <DriverCard
          name={driverName}
          rating={driverRating}
          vehicleLabel={vehicleDescription}
        />
      </View>

      <View style={styles.receiptCard}>
        {rideTypeName ? (
          <View style={styles.receiptRow}>
            <Text style={styles.receiptLabel}>Ride</Text>
            <Text style={styles.receiptValue}>{rideTypeName}</Text>
          </View>
        ) : null}
        <View style={styles.receiptRow}>
          <Text style={styles.receiptLabel}>Total</Text>
          <Text style={styles.fareValue}>{priceLabel}</Text>
        </View>
      </View>

      {driverId ? (
        <View style={styles.ratingSection}>
          <Text style={styles.receiptLabel}>Rate your trip</Text>
          <View style={styles.starsRow}>
            {[1, 2, 3, 4, 5].map((star) => (
              <TouchableOpacity
                key={star}
                disabled={submittingRating}
                onPress={() => void handleRateDriver(star)}
                style={{ padding: 4 }}
              >
                <FontAwesomeIcon
                  icon={faStar}
                  size={28}
                  color={(userRating ?? 0) >= star ? theme.primary : theme.textDull}
                />
              </TouchableOpacity>
            ))}
          </View>
          <Text style={styles.ratingHelper}>
            {ratingStatus ?? "How was your ride?"}
          </Text>
        </View>
      ) : null}

      <TouchableOpacity style={styles.doneButton} onPress={onDone}>
        <Text style={styles.doneButtonText}>Done</Text>
      </TouchableOpacity>
    </View>
  );
}

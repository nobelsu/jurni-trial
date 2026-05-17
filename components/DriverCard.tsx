import { StyleSheet, Text, useColorScheme, View } from "react-native";
import { useMemo } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { faStar } from "@fortawesome/free-solid-svg-icons/faStar";
import { Colors } from "../constants/Colors";

interface DriverCardProps {
  name: string;
  rating?: number | null;
  vehicleLabel: string;
  compact?: boolean;
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export default function DriverCard({
  name,
  rating,
  vehicleLabel,
  compact = false,
}: DriverCardProps) {
  const colorScheme = useColorScheme();
  const themeKey: keyof typeof Colors = colorScheme === "dark" ? "dark" : "light";
  const theme = Colors[themeKey];

  const ratingLabel =
    typeof rating === "number" && Number.isFinite(rating)
      ? rating.toFixed(1)
      : null;

  const styles = useMemo(
    () =>
      StyleSheet.create({
        row: {
          flexDirection: "row",
          alignItems: "center",
          gap: compact ? 10 : 12,
        },
        avatar: {
          width: compact ? 44 : 52,
          height: compact ? 44 : 52,
          borderRadius: compact ? 22 : 26,
          backgroundColor: theme.bgLight,
          alignItems: "center",
          justifyContent: "center",
        },
        initials: {
          fontFamily: "Outfit_600SemiBold",
          fontSize: compact ? 16 : 18,
          color: theme.primary,
        },
        info: {
          flex: 1,
          gap: 2,
        },
        nameRow: {
          flexDirection: "row",
          alignItems: "center",
          gap: 6,
          flexWrap: "wrap",
        },
        name: {
          fontFamily: "Outfit_600SemiBold",
          fontSize: compact ? 16 : 17,
          color: theme.text,
        },
        ratingRow: {
          flexDirection: "row",
          alignItems: "center",
          gap: 4,
        },
        ratingText: {
          fontFamily: "Outfit_500Medium",
          fontSize: 14,
          color: theme.textMuted,
        },
        vehicle: {
          fontFamily: "Outfit_400Regular",
          fontSize: 13,
          color: theme.textMuted,
          marginTop: 2,
        },
      }),
    [compact, theme.bgLight, theme.primary, theme.text, theme.textMuted]
  );

  return (
    <View style={styles.row}>
      <View style={styles.avatar}>
        <Text style={styles.initials}>{getInitials(name)}</Text>
      </View>
      <View style={styles.info}>
        <View style={styles.nameRow}>
          <Text style={styles.name} numberOfLines={1}>
            {name}
          </Text>
          {ratingLabel ? (
            <View style={styles.ratingRow}>
              <FontAwesomeIcon icon={faStar} size={12} color={theme.primary} />
              <Text style={styles.ratingText}>{ratingLabel}</Text>
            </View>
          ) : null}
        </View>
        <Text style={styles.vehicle} numberOfLines={2}>
          {vehicleLabel}
        </Text>
      </View>
    </View>
  );
}

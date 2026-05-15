import { StyleSheet, Text, useColorScheme, View } from "react-native";
import { useMemo } from "react";
import { Colors } from "../constants/Colors";
import StyleDefault from "../constants/DefaultStyles";

interface DriverOnWayProps {
  pickupLabel?: string | null;
  acceptedAtLabel?: string | null;
  distanceKm?: number;
  durationMinutes?: number;
}

function formatDistanceKm(distanceKm: number | undefined): string {
  if (typeof distanceKm !== "number" || !Number.isFinite(distanceKm) || distanceKm <= 0) {
    return "—";
  }
  if (distanceKm < 1) {
    return `${Math.round(distanceKm * 1000)} m`;
  }
  return `${distanceKm.toFixed(distanceKm < 10 ? 1 : 0)} km`;
}

function formatDurationMinutes(durationMinutes: number | undefined): string {
  if (typeof durationMinutes !== "number" || !Number.isFinite(durationMinutes) || durationMinutes <= 0) {
    return "—";
  }
  const rounded = Math.max(1, Math.round(durationMinutes));
  if (rounded < 60) {
    return `${rounded} min`;
  }
  const hours = Math.floor(rounded / 60);
  const minutes = rounded % 60;
  if (minutes === 0) {
    return `${hours} h`;
  }
  return `${hours} h ${minutes} min`;
}

function formatEta(durationMinutes: number | undefined): string {
  if (typeof durationMinutes !== "number" || !Number.isFinite(durationMinutes) || durationMinutes <= 0) {
    return "—";
  }
  const arrival = new Date(Date.now() + durationMinutes * 60000);
  return arrival.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

export default function DriverOnWay({
  pickupLabel,
  acceptedAtLabel,
  distanceKm,
  durationMinutes,
}: DriverOnWayProps) {
  const colorScheme = useColorScheme();
  const themeKey: keyof typeof Colors = colorScheme === "dark" ? "dark" : "light";
  const theme = Colors[themeKey];
  const defaultStyles = StyleDefault({ colorScheme });

  const etaLabel = useMemo(() => formatEta(durationMinutes), [durationMinutes]);
  const distanceLabel = useMemo(() => formatDistanceKm(distanceKm), [distanceKm]);
  const durationLabel = useMemo(() => formatDurationMinutes(durationMinutes), [durationMinutes]);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          paddingHorizontal: 20,
          paddingTop: 10,
          paddingBottom: 28,
          backgroundColor: theme.bgDark,
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
        },
        handle: {
          width: 44,
          height: 5,
          borderRadius: 999,
          backgroundColor: theme.textDull,
          opacity: 0.4,
          marginBottom: 16,
          alignSelf: "center",
        },
        meta: {
          fontFamily: "Outfit_500Medium",
          fontSize: 11,
          letterSpacing: 2.2,
          color: theme.textDull,
          textTransform: "uppercase",
          marginBottom: 6,
          textAlign: "center",
        },
        title: {
          ...defaultStyles.title,
          textAlign: "center",
          marginBottom: 10,
        },
        subtitle: {
          fontFamily: "Outfit_400Regular",
          fontSize: 15,
          lineHeight: 22,
          color: theme.textMuted,
          textAlign: "center",
          marginBottom: 16,
        },
        statsRow: {
          flexDirection: "row",
          gap: 10,
          marginBottom: 12,
        },
        statCard: {
          flex: 1,
          borderRadius: 14,
          paddingHorizontal: 12,
          paddingVertical: 12,
          backgroundColor: theme.bg,
          gap: 6,
        },
        statLabel: {
          fontFamily: "Outfit_500Medium",
          fontSize: 11,
          color: theme.textDull,
          textTransform: "uppercase",
          letterSpacing: 1.3,
        },
        statValue: {
          fontFamily: "Outfit_500Medium",
          fontSize: 16,
          color: theme.text,
        },
        card: {
          width: "100%",
          borderRadius: 14,
          paddingHorizontal: 14,
          paddingVertical: 12,
          backgroundColor: theme.bg,
          gap: 8,
        },
        cardLabel: {
          fontFamily: "Outfit_500Medium",
          fontSize: 12,
          color: theme.textDull,
          textTransform: "uppercase",
          letterSpacing: 1.3,
        },
        cardValue: {
          fontFamily: "Outfit_500Medium",
          fontSize: 16,
          color: theme.text,
        },
        helper: {
          fontFamily: "Outfit_400Regular",
          fontSize: 13,
          color: theme.textMuted,
        },
      }),
    [defaultStyles.title, theme.bg, theme.bgDark, theme.text, theme.textDull, theme.textMuted]
  );

  return (
    <View style={styles.container}>
      <View style={styles.handle} />
      <Text style={styles.meta}>Matched</Text>
      <Text style={styles.title}>Driver on the way</Text>
      <Text style={styles.subtitle}>Your driver has accepted your request and is heading to your pick up location.</Text>
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>ETA</Text>
          <Text style={styles.statValue}>{etaLabel}</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Distance</Text>
          <Text style={styles.statValue}>{distanceLabel}</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Arrives in</Text>
          <Text style={styles.statValue}>{durationLabel}</Text>
        </View>
      </View>
      <View style={styles.card}>
        <Text style={styles.cardLabel}>Pick up</Text>
        <Text style={styles.cardValue}>{pickupLabel || "Preparing pickup details..."}</Text>
        {acceptedAtLabel ? (
          <Text style={styles.helper}>Accepted at {acceptedAtLabel}</Text>
        ) : (
          <Text style={styles.helper}>Route is being prepared.</Text>
        )}
      </View>
    </View>
  );
}

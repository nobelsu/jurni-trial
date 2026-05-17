import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
import { useMemo, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { faPhone } from "@fortawesome/free-solid-svg-icons/faPhone";
import { faComment } from "@fortawesome/free-solid-svg-icons/faComment";
import { faShareNodes } from "@fortawesome/free-solid-svg-icons/faShareNodes";
import { faChevronDown } from "@fortawesome/free-solid-svg-icons/faChevronDown";
import { faChevronUp } from "@fortawesome/free-solid-svg-icons/faChevronUp";
import { Colors } from "../constants/Colors";
import type { DriverRouteStatus } from "../lib/rides";
import DriverCard from "./DriverCard";
import RideTimeline from "./RideTimeline";

interface DriverOnWayProps {
  pickupLabel?: string | null;
  destinationLabel?: string | null;
  durationMinutes?: number;
  routeStatus?: DriverRouteStatus;
  secret?: string | null;
  tripStarted?: boolean;
  driverName?: string;
  driverRating?: number | null;
  vehicleDescription?: string;
  onCall?: () => void;
  onMessage?: () => void;
  onSharePin?: () => void;
  onCancelRide?: () => void;
  cancelling?: boolean;
}

function formatDurationMinutes(durationMinutes: number | undefined): number | null {
  if (
    typeof durationMinutes !== "number" ||
    !Number.isFinite(durationMinutes) ||
    durationMinutes <= 0
  ) {
    return null;
  }
  return Math.max(1, Math.round(durationMinutes));
}

function buildHeroLabel(
  tripStarted: boolean,
  minutes: number | null,
  routeStatus: DriverRouteStatus
): string {
  if (routeStatus === "waiting_location") {
    return "Waiting for driver location…";
  }
  if (routeStatus === "error") {
    return "Can't load driver location";
  }
  if (routeStatus === "loading" || minutes == null) {
    return "Calculating…";
  }
  if (tripStarted) {
    return `${minutes} min to destination`;
  }
  return `Pickup in ${minutes} min`;
}

export default function DriverOnWay({
  pickupLabel,
  destinationLabel,
  durationMinutes,
  routeStatus = "waiting_location",
  secret,
  tripStarted = false,
  driverName = "Your driver",
  driverRating = null,
  vehicleDescription = "Vehicle details coming soon",
  onCall,
  onMessage,
  onSharePin,
  onCancelRide,
  cancelling = false,
}: DriverOnWayProps) {
  const colorScheme = useColorScheme();
  const themeKey: keyof typeof Colors = colorScheme === "dark" ? "dark" : "light";
  const theme = Colors[themeKey];
  const [pinExpanded, setPinExpanded] = useState(false);

  const minutes = formatDurationMinutes(durationMinutes);
  const heroLabel = buildHeroLabel(tripStarted, minutes, routeStatus);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          paddingHorizontal: 20,
          paddingTop: 4,
          backgroundColor: theme.bgDark,
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
        },
        hero: {
          fontFamily: "Outfit_600SemiBold",
          fontSize: 28,
          color: theme.text,
          marginBottom: 16,
        },
        driverSection: {
          borderRadius: 14,
          padding: 14,
          backgroundColor: theme.bg,
          marginBottom: 12,
          gap: 12,
        },
        actionsRow: {
          flexDirection: "row",
          justifyContent: "space-around",
          paddingTop: 4,
        },
        actionButton: {
          width: 48,
          height: 48,
          borderRadius: 24,
          backgroundColor: theme.bgDark,
          alignItems: "center",
          justifyContent: "center",
        },
        actionLabel: {
          fontFamily: "Outfit_400Regular",
          fontSize: 11,
          color: theme.textMuted,
          marginTop: 4,
          textAlign: "center",
        },
        actionCol: {
          alignItems: "center",
        },
        timelineCard: {
          borderRadius: 14,
          padding: 14,
          backgroundColor: theme.bg,
          marginBottom: 12,
        },
        pinRow: {
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          borderRadius: 14,
          paddingHorizontal: 14,
          paddingVertical: 12,
          backgroundColor: theme.bg,
          marginBottom: 12,
        },
        pinLabel: {
          fontFamily: "Outfit_500Medium",
          fontSize: 15,
          color: theme.text,
        },
        pinCode: {
          fontFamily: "Outfit_600SemiBold",
          fontSize: 32,
          letterSpacing: 8,
          color: theme.text,
          textAlign: "center",
          marginVertical: 8,
        },
        pinHelper: {
          fontFamily: "Outfit_400Regular",
          fontSize: 13,
          color: theme.textMuted,
          textAlign: "center",
        },
        cancelButton: {
          alignItems: "center",
          paddingVertical: 12,
        },
        cancelText: {
          fontFamily: "Outfit_500Medium",
          fontSize: 15,
          color: theme.textMuted,
        },
      }),
    [theme.bg, theme.bgDark, theme.text, theme.textMuted]
  );

  const pickup = pickupLabel || "Pickup location";
  const destination = destinationLabel || "Destination";

  return (
    <View style={styles.container}>
      <Text style={styles.hero}>{heroLabel}</Text>

      <View style={styles.driverSection}>
        <DriverCard
          name={driverName}
          rating={driverRating}
          vehicleLabel={vehicleDescription}
        />
        <View style={styles.actionsRow}>
          <View style={styles.actionCol}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={onCall}
              accessibilityRole="button"
              accessibilityLabel="Call driver"
            >
              <FontAwesomeIcon icon={faPhone} size={18} color={theme.text} />
            </TouchableOpacity>
            <Text style={styles.actionLabel}>Call</Text>
          </View>
          <View style={styles.actionCol}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={onMessage}
              accessibilityRole="button"
              accessibilityLabel="Message driver"
            >
              <FontAwesomeIcon icon={faComment} size={18} color={theme.text} />
            </TouchableOpacity>
            <Text style={styles.actionLabel}>Message</Text>
          </View>
          {!tripStarted && secret ? (
            <View style={styles.actionCol}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={onSharePin}
                accessibilityRole="button"
                accessibilityLabel="Share trip PIN"
              >
                <FontAwesomeIcon icon={faShareNodes} size={18} color={theme.text} />
              </TouchableOpacity>
              <Text style={styles.actionLabel}>Share PIN</Text>
            </View>
          ) : null}
        </View>
      </View>

      <View style={styles.timelineCard}>
        <RideTimeline
          pickupLabel={pickup}
          destinationLabel={destination}
          tripStarted={tripStarted}
        />
      </View>

      {!tripStarted && secret ? (
        <TouchableOpacity
          style={styles.pinRow}
          onPress={() => setPinExpanded((v) => !v)}
          activeOpacity={0.8}
        >
          <Text style={styles.pinLabel}>Trip PIN · {secret}</Text>
          <FontAwesomeIcon
            icon={pinExpanded ? faChevronUp : faChevronDown}
            size={14}
            color={theme.textMuted}
          />
        </TouchableOpacity>
      ) : null}
      {!tripStarted && secret && pinExpanded ? (
        <View style={[styles.pinRow, { flexDirection: "column", marginTop: -8 }]}>
          <Text style={styles.pinCode}>{secret}</Text>
          <Text style={styles.pinHelper}>
            Give this code to your driver when they arrive.
          </Text>
        </View>
      ) : null}

      {onCancelRide ? (
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={onCancelRide}
          disabled={cancelling}
          accessibilityRole="button"
          accessibilityLabel="Cancel ride"
        >
          {cancelling ? (
            <ActivityIndicator color={theme.textMuted} />
          ) : (
            <Text style={styles.cancelText}>Cancel ride</Text>
          )}
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

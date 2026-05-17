import { StyleSheet, Text, useColorScheme, View } from "react-native";
import { useMemo } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { faCircleDot } from "@fortawesome/free-solid-svg-icons/faCircleDot";
import { faLocationDot } from "@fortawesome/free-solid-svg-icons/faLocationDot";
import { Colors } from "../constants/Colors";

interface RideTimelineProps {
  pickupLabel: string;
  destinationLabel: string;
  tripStarted?: boolean;
}

export default function RideTimeline({
  pickupLabel,
  destinationLabel,
  tripStarted = false,
}: RideTimelineProps) {
  const colorScheme = useColorScheme();
  const themeKey: keyof typeof Colors = colorScheme === "dark" ? "dark" : "light";
  const theme = Colors[themeKey];

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          gap: 0,
        },
        row: {
          flexDirection: "row",
          alignItems: "flex-start",
          gap: 12,
        },
        iconCol: {
          width: 16,
          alignItems: "center",
        },
        connector: {
          width: 2,
          height: 20,
          backgroundColor: theme.textDull,
          opacity: 0.35,
          marginLeft: 7,
          marginVertical: 4,
        },
        textCol: {
          flex: 1,
          paddingBottom: 14,
        },
        label: {
          fontFamily: "Outfit_500Medium",
          fontSize: 11,
          color: theme.textDull,
          textTransform: "uppercase",
          letterSpacing: 1.2,
          marginBottom: 2,
        },
        address: {
          fontFamily: "Outfit_500Medium",
          fontSize: 15,
          color: theme.text,
          lineHeight: 20,
        },
        activeAddress: {
          color: tripStarted ? theme.text : theme.textMuted,
        },
      }),
    [theme.primary, theme.text, theme.textDull, theme.textMuted, tripStarted]
  );

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <View style={styles.iconCol}>
          <FontAwesomeIcon icon={faCircleDot} size={14} color={theme.primary} />
        </View>
        <View style={styles.textCol}>
          <Text style={styles.label}>Pickup</Text>
          <Text
            style={[styles.address, !tripStarted ? styles.activeAddress : null]}
            numberOfLines={2}
          >
            {pickupLabel}
          </Text>
        </View>
      </View>
      <View style={styles.connector} />
      <View style={styles.row}>
        <View style={styles.iconCol}>
          <FontAwesomeIcon icon={faLocationDot} size={14} color={theme.primary} />
        </View>
        <View style={[styles.textCol, { paddingBottom: 0 }]}>
          <Text style={styles.label}>Dropoff</Text>
          <Text
            style={[styles.address, tripStarted ? styles.activeAddress : null]}
            numberOfLines={2}
          >
            {destinationLabel}
          </Text>
        </View>
      </View>
    </View>
  );
}

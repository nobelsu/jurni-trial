import { StyleSheet, TouchableOpacity, useColorScheme, View } from "react-native";
import { useMemo } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { faLocationCrosshairs } from "@fortawesome/free-solid-svg-icons/faLocationCrosshairs";
import { Colors } from "../constants/Colors";

interface RideMapControlsProps {
  bottomOffset: number;
  onRecenter: () => void;
}

export default function RideMapControls({
  bottomOffset,
  onRecenter,
}: RideMapControlsProps) {
  const colorScheme = useColorScheme();
  const themeKey: keyof typeof Colors = colorScheme === "dark" ? "dark" : "light";
  const theme = Colors[themeKey];

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          position: "absolute",
          right: 20,
          bottom: bottomOffset,
          zIndex: 1000,
        },
        button: {
          width: 44,
          height: 44,
          borderRadius: 22,
          backgroundColor: theme.bgDark,
          justifyContent: "center",
          alignItems: "center",
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.15,
          shadowRadius: 4,
          elevation: 4,
        },
      }),
    [theme.bgDark]
  );

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.button}
        onPress={onRecenter}
        accessibilityRole="button"
        accessibilityLabel="Recenter map on route"
      >
        <FontAwesomeIcon icon={faLocationCrosshairs} size={20} color={theme.text} />
      </TouchableOpacity>
    </View>
  );
}

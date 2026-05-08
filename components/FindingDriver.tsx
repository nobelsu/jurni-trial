import {
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
import Animated, {
  Easing,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { faLocationCrosshairs } from "@fortawesome/free-solid-svg-icons/faLocationCrosshairs";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Colors } from "../constants/Colors";
import StyleDefault from "../constants/DefaultStyles";

const STATUS_MESSAGES = [
  "Scanning area…",
  "Notifying drivers…",
  "Almost there…",
];

function PulseRing({
  delayMs,
  borderColor,
}: {
  delayMs: number;
  borderColor: string;
}) {
  const p = useSharedValue(0);

  useEffect(() => {
    p.value = withDelay(
      delayMs,
      withRepeat(
        withTiming(1, {
          duration: 2400,
          easing: Easing.out(Easing.quad),
        }),
        -1,
        false
      )
    );
  }, [delayMs, p]);

  const style = useAnimatedStyle(() => ({
    transform: [{ scale: 0.6 + p.value * 1.6 }],
    opacity: 0.55 * (1 - p.value),
  }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        {
          position: "absolute",
          width: 72,
          height: 72,
          borderRadius: 999,
          borderWidth: 1.5,
          borderColor,
        },
        style,
      ]}
    />
  );
}

interface FindingDriverProps {
  onCancel: () => void;
}

export default function FindingDriver({ onCancel }: FindingDriverProps) {
  const colorScheme = useColorScheme();
  const themeKey: keyof typeof Colors = colorScheme === "dark" ? "dark" : "light";
  const theme = Colors[themeKey];
  const defaultStyles = StyleDefault({ colorScheme });
  const windowWidth = Dimensions.get("window").width;

  const [msgIndex, setMsgIndex] = useState(0);
  const lineOpacity = useSharedValue(1);
  const breathe = useSharedValue(0);

  const bumpMessage = useCallback(() => {
    setMsgIndex((i) => (i + 1) % STATUS_MESSAGES.length);
  }, []);

  useEffect(() => {
    breathe.value = withRepeat(
      withTiming(1, {
        duration: 1400,
        easing: Easing.inOut(Easing.sin),
      }),
      -1,
      true
    );
  }, [breathe]);

  useEffect(() => {
    const id = setInterval(() => {
      lineOpacity.value = withSequence(
        withTiming(0, { duration: 240 }, (finished) => {
          if (finished) {
            runOnJS(bumpMessage)();
          }
        }),
        withTiming(1, { duration: 280 })
      );
    }, 3800);
    return () => clearInterval(id);
  }, [bumpMessage, lineOpacity]);

  const beaconStyle = useAnimatedStyle(() => ({
    transform: [
      {
        scale: interpolate(breathe.value, [0, 1], [1, 1.06]),
      },
    ],
  }));

  const statusLineStyle = useAnimatedStyle(() => ({
    opacity: lineOpacity.value,
  }));

  const styles = useMemo(
    () =>
      StyleSheet.create({
        sheet: {
          paddingHorizontal: 20,
          paddingTop: 10,
          paddingBottom: 28,
          backgroundColor: theme.bgDark,
          alignItems: "center",
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
        },
        meta: {
          fontFamily: "Outfit_500Medium",
          fontSize: 11,
          letterSpacing: 2.2,
          color: theme.textDull,
          textTransform: "uppercase",
          marginBottom: 6,
        },
        title: {
          ...defaultStyles.title,
          textAlign: "center",
          marginBottom: 18,
        },
        beaconWrap: {
          width: 128,
          height: 128,
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 16,
        },
        status: {
          fontFamily: "Outfit_400Regular",
          fontSize: 15,
          color: theme.textMuted,
          textAlign: "center",
          minHeight: 22,
          marginBottom: 16,
        },
        cancelButton: {
          width: "100%",
          height: 50,
          borderRadius: 12,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: theme.bg,
        },
        cancelText: {
          fontFamily: "Outfit_500Medium",
          fontSize: 16,
          color: theme.text,
        },
      }),
    [defaultStyles.title, theme.bg, theme.bgDark, theme.text, theme.textDull, theme.textMuted]
  );

  return (
    <View>
      <View style={styles.sheet}>
        <Text style={styles.meta}>
          Searching
        </Text>

        <Text style={styles.title}>
          Finding your driver
        </Text>

        <View style={styles.beaconWrap}>
          <PulseRing delayMs={0} borderColor={theme.primary} />
          <PulseRing delayMs={800} borderColor={theme.primary} />
          <PulseRing delayMs={1600} borderColor={theme.primary} />

          <Animated.View
            style={[
              {
                width: 28,
                height: 28,
                borderRadius: 999,
                backgroundColor: theme.primary,
                alignItems: "center",
                justifyContent: "center",
                shadowColor: theme.primary,
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 0.35,
                shadowRadius: 8,
                elevation: 5,
              },
              beaconStyle,
            ]}
          >
            <FontAwesomeIcon
              icon={faLocationCrosshairs}
              size={12}
              color={
                colorScheme === "dark"
                  ? "rgba(255,255,255,0.95)"
                  : "rgba(255,255,255,0.98)"
              }
            />
          </Animated.View>
        </View>

        <Animated.Text
          style={[
            styles.status,
            statusLineStyle,
          ]}
        >
          {STATUS_MESSAGES[msgIndex]}
        </Animated.Text>

        <TouchableOpacity
          onPress={onCancel}
          hitSlop={{ top: 12, bottom: 12, left: 24, right: 24 }}
          accessibilityRole="button"
          accessibilityLabel="Cancel driver search"
          style={styles.cancelButton}
        >
          <Text style={styles.cancelText}>
            Cancel
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

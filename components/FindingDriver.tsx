import {
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
  "Connecting you to a driver…",
  "Notifying nearby drivers…",
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
  timedOut?: boolean;
  onTryAgain?: () => void;
}

export default function FindingDriver({
  onCancel,
  timedOut = false,
  onTryAgain,
}: FindingDriverProps) {
  const colorScheme = useColorScheme();
  const themeKey: keyof typeof Colors = colorScheme === "dark" ? "dark" : "light";
  const theme = Colors[themeKey];
  const defaultStyles = StyleDefault({ colorScheme });

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
    if (timedOut) return;
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
  }, [bumpMessage, lineOpacity, timedOut]);

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
          paddingTop: 8,
          paddingBottom: timedOut ? 20 : 24,
          backgroundColor: theme.bgDark,
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
        },
        title: {
          ...defaultStyles.title,
          textAlign: "left",
          marginBottom: 6,
        },
        subtitle: {
          fontFamily: "Outfit_400Regular",
          fontSize: 15,
          lineHeight: 22,
          color: theme.textMuted,
          textAlign: "left",
          marginBottom: timedOut ? 12 : 14,
        },
        beaconWrap: {
          width: 128,
          height: 100,
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 12,
          alignSelf: "center",
        },
        status: {
          fontFamily: "Outfit_400Regular",
          fontSize: 15,
          color: theme.textMuted,
          textAlign: "center",
          minHeight: 22,
          marginBottom: 16,
        },
        primaryButton: {
          width: "100%",
          height: 50,
          borderRadius: 10,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: theme.primary,
          marginBottom: 10,
        },
        primaryText: {
          fontFamily: "Outfit_500Medium",
          fontSize: 16,
          color: colorScheme === "light" ? Colors.light.bgDark : Colors.light.bgLight,
        },
        secondaryButton: {
          width: "100%",
          height: 50,
          borderRadius: 10,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: theme.bg,
        },
        secondaryText: {
          fontFamily: "Outfit_500Medium",
          fontSize: 16,
          color: theme.text,
        },
      }),
    [
      colorScheme,
      defaultStyles.title,
      theme.bg,
      theme.bgDark,
      theme.primary,
      theme.text,
      theme.textMuted,
      timedOut,
    ]
  );

  if (timedOut) {
    return (
      <View style={styles.sheet}>
        <Text style={styles.title}>No drivers nearby</Text>
        <Text style={styles.subtitle}>
          We couldn&apos;t find a driver right now. Try again in a moment or adjust your pickup.
        </Text>
        <TouchableOpacity
          onPress={onTryAgain}
          style={styles.primaryButton}
          accessibilityRole="button"
          accessibilityLabel="Try again"
        >
          <Text style={styles.primaryText}>Try again</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={onCancel}
          style={styles.secondaryButton}
          accessibilityRole="button"
          accessibilityLabel="Cancel"
        >
          <Text style={styles.secondaryText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.sheet}>
      <Text style={styles.title}>Finding your driver</Text>
      <Text style={styles.subtitle}>Hang tight — we&apos;re matching you with a nearby driver.</Text>

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

      <Animated.Text style={[styles.status, statusLineStyle]}>
        {STATUS_MESSAGES[msgIndex]}
      </Animated.Text>

      <TouchableOpacity
        onPress={onCancel}
        hitSlop={{ top: 12, bottom: 12, left: 24, right: 24 }}
        accessibilityRole="button"
        accessibilityLabel="Cancel driver search"
        style={styles.secondaryButton}
      >
        <Text style={styles.secondaryText}>Cancel</Text>
      </TouchableOpacity>
    </View>
  );
}

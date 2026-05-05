import {
  Dimensions,
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
import Svg, { Defs, LinearGradient, Rect, Stop } from "react-native-svg";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { faLocationCrosshairs } from "@fortawesome/free-solid-svg-icons/faLocationCrosshairs";
import { useCallback, useEffect, useId, useState } from "react";
import { Colors } from "../constants/Colors";

const STATUS_MESSAGES = [
  "Scanning your area…",
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
}

export default function FindingDriver({ onCancel }: FindingDriverProps) {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? "light"];
  const windowWidth = Dimensions.get("window").width;
  const trackWidth = windowWidth - 40;

  const [msgIndex, setMsgIndex] = useState(0);
  const lineOpacity = useSharedValue(1);
  const shimmerX = useSharedValue(-100);
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
    shimmerX.value = withRepeat(
      withTiming(trackWidth + 80, {
        duration: 1800,
        easing: Easing.linear,
      }),
      -1,
      false
    );
  }, [shimmerX, trackWidth]);

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

  const shimmerStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shimmerX.value }],
  }));

  const reactId = useId();
  const gradientId = `findingDriverShimmer_${reactId.replace(/[^a-zA-Z0-9]/g, "")}`;

  return (
    <View>
      <View
        style={{
          paddingHorizontal: 20,
          paddingTop: 16,
          paddingBottom: 22,
          backgroundColor: theme.bgDark,
          alignItems: "center",
        }}
      >
        <Text
          style={{
            fontFamily: "Outfit_500Medium",
            fontSize: 11,
            letterSpacing: 3.2,
            color: theme.textDull,
            textTransform: "uppercase",
            marginBottom: 6,
          }}
        >
          Searching
        </Text>

        <Text
          style={{
            fontFamily: "Outfit_600SemiBold",
            fontSize: 24,
            letterSpacing: -0.4,
            color: theme.text,
            marginBottom: 18,
            textAlign: "center",
          }}
        >
          Finding your driver
        </Text>

        <View
          style={{
            width: 140,
            height: 140,
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 18,
          }}
        >
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
                shadowOpacity: 0.55,
                shadowRadius: 12,
                elevation: 8,
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
            {
              fontFamily: "Outfit_400Regular",
              fontSize: 15,
              color: theme.textMuted,
              textAlign: "center",
              minHeight: 22,
              marginBottom: 16,
            },
            statusLineStyle,
          ]}
        >
          {STATUS_MESSAGES[msgIndex]}
        </Animated.Text>

        <View
          style={{
            width: "100%",
            height: 4,
            borderRadius: 2,
            backgroundColor: theme.bg,
            overflow: "hidden",
            marginBottom: 18,
          }}
        >
          <Animated.View
            style={[
              {
                position: "absolute",
                left: 0,
                top: 0,
                height: 4,
                width: 140,
              },
              shimmerStyle,
            ]}
          >
            <Svg width={140} height={4}>
              <Defs>
                <LinearGradient id={gradientId} x1="0" y1="0" x2="1" y2="0">
                  <Stop
                    offset="0"
                    stopColor={theme.primary}
                    stopOpacity={0}
                  />
                  <Stop
                    offset="0.45"
                    stopColor={theme.primary}
                    stopOpacity={0.95}
                  />
                  <Stop
                    offset="1"
                    stopColor={theme.primary}
                    stopOpacity={0}
                  />
                </LinearGradient>
              </Defs>
              <Rect
                width={140}
                height={4}
                rx={2}
                fill={`url(#${gradientId})`}
              />
            </Svg>
          </Animated.View>
        </View>

        <Text
          style={{
            fontFamily: "Outfit_400Regular",
            fontSize: 13,
            color: theme.textDull,
            textAlign: "center",
            lineHeight: 18,
            marginBottom: 14,
          }}
        >
          Hang tight — we're matching you with nearby drivers. This usually
          takes less than a minute.
        </Text>

        <TouchableOpacity
          onPress={onCancel}
          hitSlop={{ top: 12, bottom: 12, left: 24, right: 24 }}
          accessibilityRole="button"
          accessibilityLabel="Cancel driver search"
        >
          <Text
            style={{
              fontFamily: "Outfit_500Medium",
              fontSize: 15,
              color: theme.textMuted,
              textDecorationLine: "underline",
              textDecorationColor: theme.textMuted,
            }}
          >
            Cancel
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

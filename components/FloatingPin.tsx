import React, { useEffect } from "react";
import { View, useColorScheme } from "react-native";
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { Colors } from "../constants/Colors";

interface FloatingPinProps {
  isDragging: boolean;
}

export default function FloatingPin({ isDragging }: FloatingPinProps) {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? "light"];

  const liftProgress = useSharedValue(0);

  useEffect(() => {
    liftProgress.value = withTiming(isDragging ? 1 : 0, {
      duration: isDragging ? 150 : 180,
    });
  }, [isDragging, liftProgress]);

  const topStyle = useAnimatedStyle(() => {
    const translateY = interpolate(liftProgress.value, [0, 1], [0, -16]);
    const scale = interpolate(liftProgress.value, [0, 1], [1, 1.02]);
    return {
      transform: [{ translateY }, { scale }],
      zIndex: 2,
    };
  });

  const baseStyle = useAnimatedStyle(() => {
    const scaleY = interpolate(liftProgress.value, [0, 1], [1, 0.94]);
    const scaleX = interpolate(liftProgress.value, [0, 1], [1, 1.04]);
    const opacity = interpolate(liftProgress.value, [0, 1], [0.25, 0.4]);
    return {
      transform: [{ scaleX }, { scaleY }],
      opacity,
      zIndex: 0,
    };
  });

  return (
    <View
      pointerEvents="none"
      style={{
        alignItems: "center",
        justifyContent: "flex-end",
      }}
    >
      <Animated.View
        style={[
          {
            width: 24,
            height: 18,
            borderRadius: 9,
            backgroundColor: theme.bg,
            position: "absolute",
            bottom: -9,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 0.5 },
            shadowOpacity: 0.25,
            shadowRadius: 4,
            elevation: 3,
          },
          baseStyle,
        ]}
      />

      <Animated.View
        style={[
          {
            width: 26,
            height: 20,
            borderRadius: 999,
            backgroundColor: theme.primary,
            alignItems: "center",
            justifyContent: "center",
            // marginBottom: 10,
          },
          topStyle,
        ]}
      />
      <View
        style={{
          width: 3,
          height: 14,
          backgroundColor: theme.primary,
          borderRadius: 999,
          // marginBottom: 2,
          zIndex: 1,
        }}
      />
    </View>
  );
}


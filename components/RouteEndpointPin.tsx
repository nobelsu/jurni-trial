import React from "react";
import { View, useColorScheme } from "react-native";
import { Colors } from "../constants/Colors";

type RouteEndpointPinType = "start" | "end";

interface RouteEndpointPinProps {
  type: RouteEndpointPinType;
}

export default function RouteEndpointPin({ type }: RouteEndpointPinProps) {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? "light"];

  const isStart = type === "start";

  return (
    <View
      pointerEvents="none"
      style={{
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <View
        style={{
          width: 24,
          height: 24,
          borderRadius: isStart ? 6 : 12,
          backgroundColor: isStart ? theme.success ?? theme.primary : theme.bgDark,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <View
          style={{
            width: isStart ? 18 : 18,
            height: isStart ? 18 : 18,
            borderRadius: isStart ? 4 : 9,
            backgroundColor: isStart ? theme.bg : theme.primary,
            alignItems: "center",
            justifyContent: "center",
            borderWidth: isStart ? 2 : 2,
            borderColor: isStart ? (theme.success ?? theme.primary) : theme.bg,
          }}
        >
          <View
            style={{
              width: isStart ? 8 : 3,
              height: isStart ? 8 : 10,
              borderRadius: isStart ? 2 : 999,
              backgroundColor: isStart ? (theme.success ?? theme.primary) : theme.bg,
            }}
          />
        </View>
      </View>
    </View>
  );
}


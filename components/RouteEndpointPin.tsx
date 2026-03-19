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
          width: 12,
          height: 12,
          borderRadius: isStart ? 2 : 6,
          backgroundColor: theme.primary,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {/* <View
          style={{
            width: isStart ? 12 : 12,
            height: isStart ? 12 : 12,
            // borderRadius: isStart ? 4 : 9,
            // backgroundColor: isStart ? theme.bg : theme.primary,
            alignItems: "center",
            justifyContent: "center",
            borderWidth: isStart ? 2 : 2,
            borderColor: isStart ? theme.primary : theme.bg,
          }}
        >
          <View
            style={{
              width: isStart ? 8 : 3,
              height: isStart ? 8 : 10,
              borderRadius: isStart ? 2 : 999,
              backgroundColor: isStart ? theme.primary : theme.bg,
            }}
          />
        </View> */}
      </View>
    </View>
  );
}


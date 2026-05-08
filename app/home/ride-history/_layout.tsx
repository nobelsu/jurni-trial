import { Stack } from "expo-router";
import { Colors } from "../../../constants/Colors";
import { useColorScheme } from "react-native";

export default function RideHistoryLayout() {
  const colorScheme = useColorScheme();
  const themeKey: keyof typeof Colors = colorScheme === "dark" ? "dark" : "light";
  const colors = Colors[themeKey];

  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: colors.bgDark },
        headerTintColor: colors.text,
        headerTitleStyle: { fontFamily: "Outfit_600SemiBold", fontSize: 18 },
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen
        name="index"
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="ride-details/[id]"
        options={{ headerShown: false }}
      />
    </Stack>
  );
}

import { Drawer } from 'expo-router/drawer';
import { Colors } from '../../constants/Colors';
import { useColorScheme } from 'react-native';

export default function HomeStackLayout() {
  const colorScheme = useColorScheme();
  const themeKey: keyof typeof Colors = colorScheme === "dark" ? "dark" : "light";
  return (
    <Drawer
      screenOptions={{
        headerShown: false,
        drawerActiveTintColor: Colors[themeKey].primary,
        drawerLabelStyle: {
          color: Colors[themeKey].text,
          fontFamily: "Outfit_600SemiBold",
          fontSize: 14,
          textAlign: "center",
        },
        drawerStyle: {
          backgroundColor: Colors[themeKey].bg,
          width: "50%",
        },
        drawerType: "front",
      }}
    >
      <Drawer.Screen
        name="map"
        options={{
          drawerLabel: "Ride",
        }}
      />
      <Drawer.Screen
        name="ride-history"
        options={{
          drawerLabel: "History",
        }}
      />
      <Drawer.Screen
        name="settings"
        options={{
          drawerLabel: "Settings",
        }}
      />
    </Drawer>
  );
}
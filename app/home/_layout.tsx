import { Drawer } from 'expo-router/drawer';
import { Colors } from '../../constants/Colors';
import { useColorScheme } from 'react-native';

export default function HomeStackLayout() {
  const colorScheme = useColorScheme();

  return (
    <Drawer screenOptions={{
      headerShown: false,
      drawerActiveTintColor: Colors[colorScheme ?? "light"].primary,
      drawerLabelStyle: {
        color: Colors[colorScheme ?? "light"].text,
        fontFamily: "Outfit_600SemiBold",
        fontSize: 14,
        textAlign: "center",
      },
      drawerStyle: {
        backgroundColor: Colors[colorScheme ?? "light"].bg,
        width: "50%",
      },
      drawerType: "front"
    }} >
        <Drawer.Screen name="map" options={{
          drawerLabel: 'ride',
        }}/>
        <Drawer.Screen name="profile" options={{
          drawerLabel: 'profile',
        }}/>
    </Drawer>
  );
}
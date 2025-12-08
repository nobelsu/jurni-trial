import { Drawer } from 'expo-router/drawer';

export default function HomeStackLayout() {
  return (
    <Drawer screenOptions={{headerShown: false}}>
        <Drawer.Screen name="map" />
    </Drawer>
  );
}
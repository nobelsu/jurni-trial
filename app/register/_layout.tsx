import { Stack } from 'expo-router';

export default function RegisterStackLayout() {
  return (
    <Stack screenOptions={{headerShown: false, gestureEnabled: false}}>
        <Stack.Screen name="email" />
        <Stack.Screen name="password" />
        <Stack.Screen name="confirm" />
        <Stack.Screen name="details" />
    </Stack>
  );
}
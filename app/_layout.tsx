import { Stack } from 'expo-router';
import { useFonts } from 'expo-font';
import { Outfit_100Thin } from '@expo-google-fonts/outfit/100Thin';
import { Outfit_200ExtraLight } from '@expo-google-fonts/outfit/200ExtraLight';
import { Outfit_300Light } from '@expo-google-fonts/outfit/300Light';
import { Outfit_400Regular } from '@expo-google-fonts/outfit/400Regular';
import { Outfit_500Medium } from '@expo-google-fonts/outfit/500Medium';
import { Outfit_600SemiBold } from '@expo-google-fonts/outfit/600SemiBold';
import { Outfit_700Bold } from '@expo-google-fonts/outfit/700Bold';
import { Outfit_800ExtraBold } from '@expo-google-fonts/outfit/800ExtraBold';
import { Outfit_900Black } from '@expo-google-fonts/outfit/900Black';

export default function RootStackLayout() {
  let [fontsLoaded] = useFonts({
    Outfit_100Thin, 
    Outfit_200ExtraLight, 
    Outfit_300Light, 
    Outfit_400Regular, 
    Outfit_500Medium, 
    Outfit_600SemiBold, 
    Outfit_700Bold, 
    Outfit_800ExtraBold, 
    Outfit_900Black
  });
  if (!fontsLoaded) {
    return null;
  }

  return (
    <Stack screenOptions={{headerShown: false, gestureEnabled: false}}>
      <Stack.Screen name="index" />
      <Stack.Screen name="phone_number" />
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
      <Stack.Screen name="home" />
    </Stack>
  );
}
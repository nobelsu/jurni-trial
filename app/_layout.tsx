import { Stack, useRouter, useSegments } from 'expo-router';
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
import { getAuth, onAuthStateChanged } from '@react-native-firebase/auth';
import { useEffect, useRef, useState } from 'react';
import * as SplashScreen from 'expo-splash-screen';

SplashScreen.preventAutoHideAsync();
SplashScreen.setOptions({
  fade: true,
})

export default function RootStackLayout() {

  const [initializing, setInitializing] = useState(true);
  const [user, setUser] = useState();
  const router = useRouter();
  const segments = useSegments();
  const didInitialRoute = useRef(false);

  useEffect(() => {
    const subscriber = onAuthStateChanged(getAuth(), (authUser) => {
      setUser(authUser);
      setInitializing(false);
    });
    return subscriber;
  }, []);

  useEffect(() => {
    if (initializing) {
      return;
    }

    const splashTimer = setTimeout(() => {
      SplashScreen.hide();
    }, 1000);

    // Route once after auth is ready. Do not skip phone/register onboarding flows.
    if (!didInitialRoute.current) {
      didInitialRoute.current = true;
      const onHome = segments[0] === "home";
      const inOnboardingFlow =
        segments[0] === "register" ||
        segments[0] === "otp" ||
        segments[0] === "phone_number" ||
        segments[0] === "login";
      if (user && !onHome && !inOnboardingFlow) {
        router.replace("/home/map");
      }
    }

    return () => clearTimeout(splashTimer);
  }, [initializing, user, segments]);

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
    <Stack screenOptions={{headerShown: false, gestureEnabled: false, fullScreenGestureEnabled: false}} >
      <Stack.Screen name="index" />
      <Stack.Screen name="phone_number" />
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
      <Stack.Screen name="home" />
      <Stack.Screen name="otp" />
    </Stack>
  );
}
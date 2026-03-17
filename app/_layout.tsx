import { Stack, useRouter } from 'expo-router';
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
import { useEffect, useState } from 'react';
import * as SplashScreen from 'expo-splash-screen';

// #region agent log
fetch('http://127.0.0.1:7892/ingest/fb625c74-31ba-4592-9644-25e01b78d2b3',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'4da868'},body:JSON.stringify({sessionId:'4da868',runId:'pre-fix',hypothesisId:'build-vs-runtime',location:'app/_layout.tsx:21',message:'Root layout mounted',data:{platform:'ios'},timestamp:Date.now()})}).catch(()=>{});
// #endregion

SplashScreen.preventAutoHideAsync();
SplashScreen.setOptions({
  fade: true,
})

export default function RootStackLayout() {

  const [initializing, setInitializing] = useState(true);
  const [user, setUser] = useState();
  const router = useRouter();

  // Handle user state changes
  function handleAuthStateChanged(user: any) {
    setUser(user);
    if (initializing) setInitializing(false);
  }

  useEffect(() => {
    const subscriber = onAuthStateChanged(getAuth(), handleAuthStateChanged);
    return subscriber; // unsubscribe on unmount
  }, []);

  useEffect(() => {
    if (!initializing) {
      if (user) router.navigate("/home/map")
      setTimeout(() => {
        SplashScreen.hide();
      }, 1000);
    }
  }, [initializing])

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
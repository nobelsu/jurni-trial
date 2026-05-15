import { View, Text, useColorScheme } from 'react-native';
import Btn from '../components/CustomButton';
import StyleDefault from '../constants/DefaultStyles';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Colors } from '../constants/Colors';
import { getAuth, onAuthStateChanged } from '@react-native-firebase/auth';
import { useEffect, useState } from 'react';
import * as SplashScreen from 'expo-splash-screen';

export default function GettingStartedScreen() {
    const router = useRouter();
    const colorScheme = useColorScheme();
    const themeKey: keyof typeof Colors = colorScheme === "dark" ? "dark" : "light";
    const defaultStyles = StyleDefault({ colorScheme });

    return (
        <SafeAreaView style={defaultStyles.container}>
            {/* <View style={{flex: 1, paddingTop: 20, gap: 5,}}>
                <Text style={{fontSize: 14, fontFamily: "Outfit_900Black", color: Colors[themeKey].text}}>jurni</Text>
                <Text style={{fontSize: 14, fontFamily: "Outfit_900Black", color: Colors[themeKey].primary}}>welcome</Text>
            </View> 
            <View style={{flex: 4, gap: 4, paddingTop: windowHeight*0.21,}}>
                <Text style={{fontSize: 20, fontFamily: "Outfit_400Regular", color: Colors[themeKey].primaryText}}>more than a ride</Text>
                <View style={{alignItems: "center", width: "100%",}}>
                    <Text style={{fontSize: 48, fontFamily: "Outfit_900Black", color: Colors[themeKey].primaryText}}>it's a <Text style={{color: Colors[themeKey].primary}}>jurni.</Text></Text>
                </View>
            </View> */}
            <View style={{flex: 1, justifyContent: "center", alignItems: "center", width: "100%"}}>
                <Btn styleBtn={{}} text="Get started" onPress={() => {router.navigate('/phone_number');}} />
            </View>
        </SafeAreaView>
    )
}
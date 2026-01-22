import { Text, TouchableWithoutFeedback, Keyboard, KeyboardAvoidingView, View, TextInput, TouchableOpacity, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useGlobalSearchParams } from 'expo-router';
import { useColorScheme } from 'react-native';
import StyleDefault from '../constants/DefaultStyles';
import { Colors } from '../constants/Colors';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome'
import { faEnvelope } from '@fortawesome/free-solid-svg-icons/faEnvelope'
import { faAngleLeft } from '@fortawesome/free-solid-svg-icons/faAngleLeft';
import Btn from '../components/CustomButton';
import { useEffect, useRef, useState } from 'react';

import { onAuthStateChanged, signInWithPhoneNumber } from '@react-native-firebase/auth';
import auth from '@react-native-firebase/auth';

export default function OtpScreen() {
    const router = useRouter();
    const colorScheme = useColorScheme();
    const defaultStyles = StyleDefault({ colorScheme });
    const number = useGlobalSearchParams<{ number : string }>().number;
    
    const [code, setCode] = useState<string>("");
    const [message, setMessage] = useState<string>("");
    const [confirm, setConfirm] = useState<any>(null);
    const [user, setUser] = useState<any>();

    function handleAuthStateChanged(user: any) {
        setUser(user);
        console.log(user);
    }

    useEffect(() => {
        async function sendCode() {
            const confirmation = await signInWithPhoneNumber(auth(), number);
            setConfirm(confirmation);
        }
        sendCode();
        
        const subscriber = onAuthStateChanged(auth(), handleAuthStateChanged);
        return subscriber; // unsubscribe on unmount
    }, []);

    async function confirmCode() {
        try {
            await confirm.confirm(code);

            const email = user.email;

            if (email) {
                await auth().signOut();
                router.push({pathname: 'login/password', params: {email: email}});
            } else {
                router.navigate('register/email');
            }
        } catch (error) {
            setMessage("Invalid code")
        }
    }

    return (
        <TouchableWithoutFeedback onPress={() => {Keyboard.dismiss()}}>
            <SafeAreaView style={defaultStyles.container}>

                <KeyboardAvoidingView style={{flex: 1,}} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>

                    <View style={{flex: 5, paddingTop: 30,}}>
                        <Text style={defaultStyles.title}>Enter your OTP code</Text>
                        <Text style={{...defaultStyles.subtitle, marginTop: 10,}}>We've sent you an OTP code</Text>
                        <View style={{marginTop: 20, height: 60,}}>
                            <View style={{flex: 1, alignItems: "center", justifyContent: "center", flexDirection: "row", borderRadius: 15, backgroundColor: Colors[colorScheme ?? "light"].secondaryBackground, gap: 12,}}>
                                <FontAwesomeIcon icon={faEnvelope} size={14} color={Colors[colorScheme ?? "light"].secondaryText}/>
                                <TextInput style={{width: "80%", height: "100%", fontSize: 16, fontFamily:'Outfit_400Regular', color: Colors[colorScheme ?? "light"].secondaryText,}} placeholderTextColor={Colors[colorScheme ?? "light"].tertiaryText} placeholder='Code' autoFocus selectionColor={Colors[colorScheme ?? "light"].secondaryText} keyboardType='email-address' autoCapitalize='none' value={code} onChangeText={setCode}/>
                            </View>
                        </View>
                    </View>
                    
                    <View style={{flex: 1, flexDirection: "row"}}>
                        <View style={{flex: 1, justifyContent: "center", alignItems: "flex-start", width: "100%"}}>
                            <TouchableOpacity onPress={() => {router.back()}} style={{padding: 16, borderRadius: "100%", backgroundColor: Colors[colorScheme ?? "light"].primary}}>
                                <FontAwesomeIcon icon={faAngleLeft} size={20} color={Colors[colorScheme ?? "light"].btnText}/>
                            </TouchableOpacity>
                        </View>
                        <View style={{flex: 1, justifyContent: "center", alignItems: "flex-end", width: "100%"}}>
                            <Btn styleBtn={{width: "80%", borderRadius: 100,}} text="confirm" onPress={confirmCode} />
                        </View>
                    </View>

                    <Text style={defaultStyles.title}> {message} </Text>
                </KeyboardAvoidingView>
            </SafeAreaView>
        </TouchableWithoutFeedback>
    )
}
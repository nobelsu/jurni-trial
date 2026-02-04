import { Text, TouchableWithoutFeedback, Keyboard, KeyboardAvoidingView, View, TextInput, TouchableOpacity, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useGlobalSearchParams } from 'expo-router';
import { useColorScheme } from 'react-native';
import StyleDefault from '../constants/DefaultStyles';
import { Colors } from '../constants/Colors';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome'
import { faAngleLeft } from '@fortawesome/free-solid-svg-icons/faAngleLeft';
import Btn from '../components/CustomButton';
import { useEffect, useRef, useState } from 'react';

import { onAuthStateChanged, signInWithPhoneNumber } from '@react-native-firebase/auth';
import auth from '@react-native-firebase/auth';

import {
  CodeField,
  Cursor,
  useBlurOnFulfill,
  useClearByFocusCell,
} from 'react-native-confirmation-code-field';

import { StyleSheet } from 'react-native';
import BackBtn from '../components/BackButton';
import Error from '../components/Error';

export default function OtpScreen() {
    const router = useRouter();
    const colorScheme = useColorScheme();
    const defaultStyles = StyleDefault({ colorScheme });
    const number = useGlobalSearchParams<{ number : string }>().number;
    
    const [code, setCode] = useState<string>("");
    const [confirm, setConfirm] = useState<any>(null);
    const [user, setUser] = useState<any>();

    const [errorMessage, setErrorMessage] = useState<string>("");
    const [errorVisibility, setErrorVisibility] = useState<boolean>(false);

    function handleAuthStateChanged(user: any) {
        setUser(user);
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
        setErrorMessage("");
        setErrorVisibility(false);

        try {
            if (!code) {
                setErrorMessage("Verification code is required.");
                setErrorVisibility(true);
                return;
            }

            if (!/^\d+$/.test(code)) {
                setErrorMessage("Verification code must contain digits only.");
                setErrorVisibility(true);
                return;
            }

            if (code.length < 4) {
                setErrorMessage("Invalid verification code.");
                setErrorVisibility(true);
                return;
            }

            await confirm.confirm(code);

            const email = user.email;

            if (email) {
                await auth().signOut();
                router.push({pathname: 'login/password', params: {email: email}});
            } else {
                router.navigate('register/email');
            }
        } catch (error) {
            setErrorMessage("Verification failed. Please check the code and try again.");
            setErrorVisibility(true);
        }
    }

        const ref = useBlurOnFulfill({value: code, cellCount: 6});
        const [props, getCellOnLayoutHandler] = useClearByFocusCell({
            value: code,
            setValue: setCode,
        });

    return (
        <TouchableWithoutFeedback onPress={() => {Keyboard.dismiss()}}>
            <SafeAreaView style={defaultStyles.container}>

                <KeyboardAvoidingView style={{flex: 1,}} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>

                    <View style={{flex: 5, paddingTop: 30,}}>
                        <Text style={defaultStyles.title}>Verify your phone number</Text>
                        <Text style={{...defaultStyles.subtitle, marginTop: 10,}}>Enter the security code sent to <Text style={{fontFamily: "Outfit_600SemiBold", color: Colors[colorScheme ?? "light"].secondary}}>{number}</Text></Text>
                        <View style={{marginTop: 20, alignItems: "center"}}>
                            <CodeField  
                                ref={ref}
                                {...props}
                                // Use `caretHidden={false}` when users can't paste a text value, because context menu doesn't appear
                                autoFocus={true}
                                value={code}
                                onChangeText={setCode}
                                cellCount={6}
                                rootStyle={{width: "100%"}}
                                keyboardType="number-pad"
                                textContentType="oneTimeCode"
                                testID="my-code-input"
                                renderCell={({index, symbol, isFocused}) => (
                                <Text
                                    key={index}
                                    style={[
                                        {
                                            width: 50,
                                            height: 50,
                                            lineHeight: 45,
                                            fontSize: 20,
                                            borderWidth: 1,
                                            borderColor: Colors[colorScheme ?? "light"].bg, 
                                            textAlign: 'center',
                                            color: Colors[colorScheme ?? "light"].text,
                                            fontFamily: 'Outfit_400Regular',
                                            backgroundColor: Colors[colorScheme ?? "light"].bg, 
                                            borderRadius: 12,
                                        }, 
                                        isFocused && {
                                            borderColor: Colors[colorScheme ?? "light"].secondary,
                                        }
                                    ]}
                                    onLayout={getCellOnLayoutHandler(index)}>
                                    {symbol || (isFocused && <Cursor />)}
                                </Text>
                                )}
                            />
                        </View>
                        {errorVisibility && <Error message={errorMessage} styleError={{marginTop: 20,}} />}
                    </View>
                    
                    <View style={{flex: 1, flexDirection: "row"}}>
                        <View style={{flex: 1, justifyContent: "center", alignItems: "flex-start", width: "100%"}}>
                            <BackBtn onPress={() => {router.back()}}/>
                        </View>
                        <View style={{flex: 1, justifyContent: "center", alignItems: "flex-end", width: "100%"}}>
                            <Btn styleBtn={{width: "80%", borderRadius: 100,}} text="Confirm" onPress={confirmCode} />
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </SafeAreaView>
        </TouchableWithoutFeedback>
    )
}
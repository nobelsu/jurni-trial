import { View, Text, useColorScheme, KeyboardAvoidingView, Platform, TextInput, TouchableWithoutFeedback, Keyboard, TouchableOpacity } from 'react-native';
import Btn from '../../components/CustomButton';
import StyleDefault from '../../constants/DefaultStyles';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useGlobalSearchParams, useRouter } from 'expo-router';
import { Colors } from '../../constants/Colors';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome'
import { faLock } from '@fortawesome/free-solid-svg-icons/faLock'
import { faAngleLeft } from '@fortawesome/free-solid-svg-icons/faAngleLeft';

import { useState, useEffect } from 'react';
import BackBtn from '../../components/BackButton';
import Error from '../../components/Error';

export default function RegisterPasswordScreen() {
    const router = useRouter();
    const colorScheme = useColorScheme();
    const defaultStyles = StyleDefault({ colorScheme });

    const [password, setPassword] = useState<string>("");

    const [errorMessage, setErrorMessage] = useState<string>("");
    const [errorVisibility, setErrorVisibility] = useState<boolean>(false);

    const email = useGlobalSearchParams<{ email: string }>().email;

    async function handleConfirm() {
        setErrorMessage("");
        setErrorVisibility(false);

        if (!password) {
            setErrorMessage("Password is required.");
            setErrorVisibility(true);
            return;
        }

        if (password.length < 8) {
            setErrorMessage("Password must be at least 8 characters long.");
            setErrorVisibility(true);
            return;
        }

        if (/\s/.test(password)) {
            setErrorMessage("Password must not contain spaces.");
            setErrorVisibility(true);
            return;
        }

        if (!/[A-Za-z]/.test(password)) {
            setErrorMessage("Password must contain at least one letter.");
            setErrorVisibility(true);
            return;
        }

        if (!/[0-9]/.test(password)) {
            setErrorMessage("Password must contain at least one number.");
            setErrorVisibility(true);
            return;
        }

        router.push({pathname: 'register/confirm', params: { email: email, password: password }});
    }

    return (
        <TouchableWithoutFeedback onPress={() => {Keyboard.dismiss()}}>
            <SafeAreaView style={defaultStyles.container}>
                <KeyboardAvoidingView style={{flex: 1,}} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
                    <View style={{flex: 5, paddingTop: 30,}}>
                        <Text style={defaultStyles.title}>Enter your password</Text>
                        <Text style={{...defaultStyles.subtitle, marginTop: 10,}}>This will be used to secure your account</Text>
                        <View style={{marginTop: 20, height: 60,}}>
                            <View style={{flex: 1, alignItems: "center", justifyContent: "center", flexDirection: "row", borderRadius: 15, backgroundColor: Colors[colorScheme ?? "light"].bg, gap: 12,}}>
                                <FontAwesomeIcon icon={faLock} size={14} color={Colors[colorScheme ?? "light"].textMuted}/>
                                <TextInput style={{width: "80%", height: "100%", fontSize: 16, fontFamily:'Outfit_400Regular', color: Colors[colorScheme ?? "light"].textMuted,}} placeholderTextColor={Colors[colorScheme ?? "light"].textDull} secureTextEntry placeholder='Password' autoFocus selectionColor={Colors[colorScheme ?? "light"].textMuted} value={password} onChangeText={setPassword}/>
                            </View>
                        </View>
                        {errorVisibility && <Error message={errorMessage} styleError={{marginTop: 20,}} />}
                    </View>
                    
                    <View style={{flex: 1, flexDirection: "row"}}>
                        <View style={{flex: 1, justifyContent: "center", alignItems: "flex-start", width: "100%"}}>
                            <BackBtn onPress={() => {router.push("register/email")}}/>
                        </View>
                        <View style={{flex: 1, justifyContent: "center", alignItems: "flex-end", width: "100%"}}>
                            <Btn styleBtn={{width: "80%", borderRadius: 100,}} text="Next" onPress={handleConfirm} />
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </SafeAreaView>
        </TouchableWithoutFeedback>
    )
}

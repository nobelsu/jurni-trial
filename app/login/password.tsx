import { View, Text, useColorScheme, KeyboardAvoidingView, Platform, TextInput, TouchableWithoutFeedback, Keyboard, TouchableOpacity } from 'react-native';
import Btn from '../../components/CustomButton';
import StyleDefault from '../../constants/DefaultStyles';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useGlobalSearchParams, useRouter } from 'expo-router';
import { Colors } from '../../constants/Colors';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome'
import { faLock } from '@fortawesome/free-solid-svg-icons/faLock'
import { faAngleLeft } from '@fortawesome/free-solid-svg-icons/faAngleLeft';

import { useState } from 'react';
import auth, { signInWithEmailAndPassword } from '@react-native-firebase/auth';
import BackBtn from '../../components/BackButton';
import Error from '../../components/Error';

export default function LoginPasswordScreen() {
    const router = useRouter();
    const colorScheme = useColorScheme();
    const defaultStyles = StyleDefault({ colorScheme });

    const email = useGlobalSearchParams<{ email: string }>().email;
    const [password, setPassword] = useState<string>("");

    const [errorMessage, setErrorMessage] = useState<string>("");
    const [errorVisibility, setErrorVisibility] = useState<boolean>(false);

    async function handleLogin() {
        try {
            setErrorMessage("");
            setErrorVisibility(false);
            await signInWithEmailAndPassword(auth(), email, password);
            router.navigate('home/map');
        } catch(error) {
            setErrorMessage("Please check your password and try again.");
            setErrorVisibility(true);
        }
    }

    return (
        <TouchableWithoutFeedback onPress={() => {Keyboard.dismiss()}}>
            <SafeAreaView style={defaultStyles.container}>
                <KeyboardAvoidingView style={{flex: 1,}} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
                    <View style={{flex: 5, paddingTop: 30,}}>
                        <Text style={defaultStyles.title}>Enter your password</Text>
                        <Text style={{...defaultStyles.subtitle, marginTop: 10,}}>We found an account that matches your mobile number</Text>
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
                            <BackBtn onPress={() => {router.back()}}/>
                        </View>
                        <View style={{flex: 1, justifyContent: "center", alignItems: "flex-end", width: "100%"}}>
                            <Btn styleBtn={{width: "80%", borderRadius: 100,}} text="Login" onPress={handleLogin} />
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </SafeAreaView>
        </TouchableWithoutFeedback>
    )
}

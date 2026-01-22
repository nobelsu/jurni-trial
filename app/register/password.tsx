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

export default function RegisterPasswordScreen() {
    const router = useRouter();
    const colorScheme = useColorScheme();
    const defaultStyles = StyleDefault({ colorScheme });

    const [password, setPassword] = useState<string>("");

    const email = useGlobalSearchParams<{ email: string }>().email;

    async function handleConfirm() {
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
                            <View style={{flex: 1, alignItems: "center", justifyContent: "center", flexDirection: "row", borderRadius: 15, backgroundColor: Colors[colorScheme ?? "light"].secondaryBackground, gap: 12,}}>
                                <FontAwesomeIcon icon={faLock} size={14} color={Colors[colorScheme ?? "light"].secondaryText}/>
                                <TextInput style={{width: "80%", height: "100%", fontSize: 16, fontFamily:'Outfit_400Regular', color: Colors[colorScheme ?? "light"].secondaryText,}} placeholderTextColor={Colors[colorScheme ?? "light"].tertiaryText} secureTextEntry placeholder='Password' autoFocus selectionColor={Colors[colorScheme ?? "light"].secondaryText} value={password} onChangeText={setPassword}/>
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
                            <Btn styleBtn={{width: "80%", borderRadius: 100,}} text="next" onPress={handleConfirm} />
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </SafeAreaView>
        </TouchableWithoutFeedback>
    )
}

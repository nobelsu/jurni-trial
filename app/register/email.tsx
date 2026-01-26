import { Text, TouchableWithoutFeedback, Keyboard, KeyboardAvoidingView, View, TextInput, TouchableOpacity, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useColorScheme } from 'react-native';
import StyleDefault from '../../constants/DefaultStyles';
import { Colors } from '../../constants/Colors';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome'
import { faEnvelope } from '@fortawesome/free-solid-svg-icons/faEnvelope'
import { faAngleLeft } from '@fortawesome/free-solid-svg-icons/faAngleLeft';
import auth, { linkWithCredential } from '@react-native-firebase/auth';
import Btn from '../../components/CustomButton';
import { useEffect, useState }  from 'react';
import BackBtn from '../../components/BackButton';
import Error from '../../components/Error';

export default function RegisterEmailScreen() {
    const router = useRouter();
    const colorScheme = useColorScheme();
    const defaultStyles = StyleDefault({ colorScheme });

    const [email, setEmail] = useState<string>("");

    const [errorMessage, setErrorMessage] = useState<string>("");
    const [errorVisibility, setErrorVisibility] = useState<boolean>(false);

    async function addEmail() {
        setErrorMessage("");
        setErrorVisibility(false);

        const trimmedEmail = email.trim();

        if (!trimmedEmail) {
            setErrorMessage("Email is required.");
            setErrorVisibility(true);
            return;
        }

        // Practical RFC-friendly email regex (not overly strict)
        const emailRegex =
            /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

        if (!emailRegex.test(trimmedEmail)) {
            setErrorMessage("Please enter a valid email address.");
            setErrorVisibility(true);
            return;
        }

        router.push({pathname: 'register/password', params: {email: trimmedEmail}});
    }

    return (
        <TouchableWithoutFeedback onPress={() => {Keyboard.dismiss()}}>
            <SafeAreaView style={defaultStyles.container}>
                <KeyboardAvoidingView style={{flex: 1,}} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
                    <View style={{flex: 5, paddingTop: 30,}}>
                        <Text style={defaultStyles.title}>Enter your email</Text>
                        <Text style={{...defaultStyles.subtitle, marginTop: 10,}}>Let's get you setup with your email</Text>
                        <View style={{marginTop: 20, height: 60,}}>
                            <View style={{flex: 1, alignItems: "center", justifyContent: "center", flexDirection: "row", borderRadius: 15, backgroundColor: Colors[colorScheme ?? "light"].secondaryBackground, gap: 12,}}>
                                <FontAwesomeIcon icon={faEnvelope} size={14} color={Colors[colorScheme ?? "light"].secondaryText}/>
                                <TextInput style={{width: "80%", height: "100%", fontSize: 16, fontFamily:'Outfit_400Regular', color: Colors[colorScheme ?? "light"].secondaryText,}} placeholderTextColor={Colors[colorScheme ?? "light"].tertiaryText} placeholder='Email' autoFocus selectionColor={Colors[colorScheme ?? "light"].secondaryText} keyboardType='email-address' autoCapitalize='none' value={email} onChangeText={setEmail}/>
                            </View>
                        </View>
                        {errorVisibility && <Error message={errorMessage} styleError={{marginTop: 20,}} />}
                    </View>
                    
                    <View style={{flex: 1, flexDirection: "row"}}>
                        <View style={{flex: 1, justifyContent: "center", alignItems: "flex-start", width: "100%"}}>
                            <BackBtn onPress={() => {router.push("/phone_number")}}/>
                        </View>
                        <View style={{flex: 1, justifyContent: "center", alignItems: "flex-end", width: "100%"}}>
                            <Btn styleBtn={{width: "80%", borderRadius: 100,}} text="next" onPress={addEmail} />
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </SafeAreaView>
        </TouchableWithoutFeedback>
    )
}
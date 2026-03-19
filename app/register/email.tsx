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
import { faUser } from '@fortawesome/free-solid-svg-icons/faUser';
import { faVenusMars } from '@fortawesome/free-solid-svg-icons/faVenusMars';

export default function RegisterEmailScreen() {
    const router = useRouter();
    const colorScheme = useColorScheme();
    const defaultStyles = StyleDefault({ colorScheme });

    const [email, setEmail] = useState<string>("");
    const [name, setName] = useState<string>("");
    const [gender, setGender] = useState<"male" | "female" | "non_binary" | "prefer_not_to_say">("prefer_not_to_say");

    const [errorMessage, setErrorMessage] = useState<string>("");
    const [errorVisibility, setErrorVisibility] = useState<boolean>(false);

    async function addDetails() {
        setErrorMessage("");
        setErrorVisibility(false);

        const trimmedEmail = email.trim();
        const trimmedName = name.trim();

        if (!trimmedName) {
            setErrorMessage("Name is required.");
            setErrorVisibility(true);
            return;
        }

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

        router.push({
            pathname: 'register/password',
            params: {
                email: trimmedEmail,
                name: trimmedName,
                gender,
            }
        });
    }

    return (
        <TouchableWithoutFeedback onPress={() => {Keyboard.dismiss()}}>
            <SafeAreaView style={defaultStyles.container}>
                <KeyboardAvoidingView style={{flex: 1,}} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
                    <View style={{flex: 5, paddingTop: 30,}}>
                        <Text style={defaultStyles.title}>Enter your details</Text>
                        <Text style={{...defaultStyles.subtitle, marginTop: 10,}}>Let's get your profile setup</Text>
                        <View style={{marginTop: 20, height: 60,}}>
                            <View style={{flex: 1, alignItems: "center", justifyContent: "center", flexDirection: "row", borderRadius: 15, backgroundColor: Colors[colorScheme ?? "light"].bg, gap: 12,}}>
                                <FontAwesomeIcon icon={faUser} size={14} color={Colors[colorScheme ?? "light"].textMuted}/>
                                <TextInput style={{width: "80%", height: "100%", fontSize: 16, fontFamily:'Outfit_400Regular', color: Colors[colorScheme ?? "light"].textMuted,}} placeholderTextColor={Colors[colorScheme ?? "light"].textDull} placeholder='Full Name' autoFocus selectionColor={Colors[colorScheme ?? "light"].textMuted} value={name} onChangeText={setName}/>
                            </View>
                        </View>
                        <View style={{marginTop: 8, height: 60,}}>
                            <View style={{flex: 1, alignItems: "center", justifyContent: "center", flexDirection: "row", borderRadius: 15, backgroundColor: Colors[colorScheme ?? "light"].bg, gap: 12,}}>
                                <FontAwesomeIcon icon={faEnvelope} size={14} color={Colors[colorScheme ?? "light"].textMuted}/>
                                <TextInput style={{width: "80%", height: "100%", fontSize: 16, fontFamily:'Outfit_400Regular', color: Colors[colorScheme ?? "light"].textMuted,}} placeholderTextColor={Colors[colorScheme ?? "light"].textDull} placeholder='Email' autoFocus selectionColor={Colors[colorScheme ?? "light"].textMuted} keyboardType='email-address' autoCapitalize='none' value={email} onChangeText={setEmail}/>
                            </View>
                        </View>
                        <View style={{ marginTop: 8 }}>
                            <Text style={{ fontFamily: 'Outfit_500Medium', fontSize: 13, color: Colors[colorScheme ?? "light"].textMuted, marginBottom: 6 }}>
                                Gender
                            </Text>
                            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                                {[
                                    { id: "male", label: "Male" },
                                    { id: "female", label: "Female" },
                                    { id: "non_binary", label: "Non-binary" },
                                    { id: "prefer_not_to_say", label: "Prefer not to say" },
                                ].map((option) => {
                                    const isActive = gender === option.id;
                                    return (
                                        <TouchableOpacity
                                            key={option.id}
                                            onPress={() => setGender(option.id as typeof gender)}
                                            style={{
                                                flexDirection: "row",
                                                alignItems: "center",
                                                paddingHorizontal: 14,
                                                paddingVertical: 8,
                                                borderRadius: 999,
                                                backgroundColor: isActive
                                                    ? Colors[colorScheme ?? "light"].primary
                                                    : Colors[colorScheme ?? "light"].bg,
                                            }}
                                        >
                                            <FontAwesomeIcon
                                                icon={faVenusMars}
                                                size={11}
                                                color={isActive ? "#ffffff" : Colors[colorScheme ?? "light"].textMuted}
                                                style={{ marginRight: 6 }}
                                            />
                                            <Text
                                                style={{
                                                    fontFamily: 'Outfit_500Medium',
                                                    fontSize: 13,
                                                    color: isActive ? "#ffffff" : Colors[colorScheme ?? "light"].text,
                                                }}
                                            >
                                                {option.label}
                                            </Text>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                        </View>
                        {errorVisibility && <Error message={errorMessage} styleError={{marginTop: 20,}} />}
                    </View>
                    
                    <View style={{flex: 1, flexDirection: "row"}}>
                        <View style={{flex: 1, justifyContent: "center", alignItems: "flex-start", width: "100%"}}>
                            <BackBtn onPress={() => {router.back()}}/>
                        </View>
                        <View style={{flex: 1, justifyContent: "center", alignItems: "flex-end", width: "100%"}}>
                            <Btn styleBtn={{width: "80%", borderRadius: 100,}} text="Next" onPress={addDetails} />
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </SafeAreaView>
        </TouchableWithoutFeedback>
    )
}
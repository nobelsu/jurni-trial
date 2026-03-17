import { View, Text, useColorScheme, TextInput, KeyboardAvoidingView, Platform, TouchableWithoutFeedback, Keyboard, TouchableOpacity } from 'react-native';
import Btn from '../components/CustomButton';
import StyleDefault from '../constants/DefaultStyles';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Colors } from '../constants/Colors';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome'
import { faPhone } from '@fortawesome/free-solid-svg-icons/faPhone'
import { useState } from 'react';
import BackBtn from '../components/BackButton';
import Error from '../components/Error';
import PhoneInput, { ICountry, isValidPhoneNumber } from 'react-native-international-phone-number';

export default function PhoneNumberScreen() {
    const router = useRouter();
    const colorScheme = useColorScheme();
    const defaultStyles = StyleDefault({ colorScheme });

    const [selectedCountry, setSelectedCountry] = useState<ICountry | undefined>(undefined);
    const [inputValue, setInputValue] = useState<string>("");
    const [errorMessage, setErrorMessage] = useState<string>("");
    const [errorVisibility, setErrorVisibility] = useState<boolean>(false);

    function validatePhoneNumber() {
        setErrorMessage("");
        setErrorVisibility(false);

        if (!selectedCountry) {
            setErrorMessage("Please select your country.");
            setErrorVisibility(true);
            return;
        }

        if (!inputValue) {
            setErrorMessage("Phone number is required.");
            setErrorVisibility(true);
            return;
        }

        if (!isValidPhoneNumber(inputValue, selectedCountry)) {
            setErrorMessage("Invalid phone number for selected country.");
            setErrorVisibility(true);
            return;
        }

        const root = selectedCountry.idd?.root ?? '';
        const suffix = Array.isArray(selectedCountry.idd?.suffixes) && selectedCountry.idd?.suffixes.length > 0
            ? selectedCountry.idd?.suffixes[0]
            : '';
        const dialCode = `${root}${suffix}`;

        const normalizedDialCode = dialCode.startsWith('+') ? dialCode : `+${dialCode}`;
        const fullNumber = `${normalizedDialCode}${inputValue.replace(/[^0-9]/g, "")}`;

        router.push({
            pathname: "/otp",
            params: { number: fullNumber },
        });
    }

    return (
        <TouchableWithoutFeedback onPress={() => {Keyboard.dismiss()}}>
            <SafeAreaView style={defaultStyles.container}>
                <KeyboardAvoidingView style={{flex: 1,}} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
                        <View style={{flex: 5, paddingTop: 30,}}>
                        <Text style={defaultStyles.title}>Enter your mobile number</Text>
                        <Text style={{...defaultStyles.subtitle, marginTop: 10,}}>We'll check if you have an account or help you create one</Text>
                            <View style={{flexDirection: "row", marginTop: 20, gap: 4, height: 60}}>
                                <View style={{flex: 1, justifyContent: "center", borderRadius: 15, backgroundColor: Colors[colorScheme ?? "light"].bg}}>
                                    <View style={{width: "100%", height: "100%", alignItems: "center", flexDirection: "row", gap: 8, paddingHorizontal: 20}}>
                                        <View>
                                            <FontAwesomeIcon icon={faPhone} size={14} color={Colors[colorScheme ?? "light"].textMuted}/>
                                        </View>
                                        <View style={{flex: 1}}>
                                            <PhoneInput
                                                defaultCountry="GB"
                                                value={inputValue}
                                                onChangePhoneNumber={setInputValue}
                                                selectedCountry={selectedCountry}
                                                onChangeSelectedCountry={setSelectedCountry}
                                                language="eng"
                                                placeholder="Phone Number"
                                                theme={colorScheme === 'dark' ? 'dark' : 'light'}
                                                phoneInputStyles={{
                                                    container: {
                                                        backgroundColor: Colors[colorScheme ?? "light"].bg,
                                                        borderWidth: 0,
                                                    },
                                                    flagContainer: {
                                                        backgroundColor: Colors[colorScheme ?? "light"].bg,
                                                    },
                                                    divider: {
                                                        backgroundColor: Colors[colorScheme ?? "light"].border ?? Colors[colorScheme ?? "light"].textMuted,
                                                    },
                                                    callingCode: {
                                                        color: Colors[colorScheme ?? "light"].textMuted,
                                                        fontFamily: 'Outfit_400Regular',
                                                        fontSize: 16,
                                                    },
                                                    input: {
                                                        color: Colors[colorScheme ?? "light"].textMuted,
                                                        fontFamily: 'Outfit_400Regular',
                                                        fontSize: 16,
                                                    },
                                                }}
                                                phoneInputPlaceholderTextColor={Colors[colorScheme ?? "light"].textDull}
                                                phoneInputSelectionColor={Colors[colorScheme ?? "light"].textMuted}
                                            />
                                        </View>
                                    </View>
                                </View>
                            </View>
                        {errorVisibility && <Error message={errorMessage} styleError={{marginTop: 20,}} />}
                    </View>
                    <View style={{flex: 1, flexDirection: "row"}}>
                        <View style={{flex: 1, justifyContent: "center", alignItems: "flex-start", width: "100%"}}>
                            <BackBtn onPress={() => {router.back()}}/>
                        </View>
                        <View style={{flex: 1, justifyContent: "center", alignItems: "flex-end", width: "100%"}}>
                            <Btn styleBtn={{width: "80%", borderRadius: 100,}} text="Next" onPress={() => {
                                validatePhoneNumber()
                                }} />
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </SafeAreaView>
        </TouchableWithoutFeedback>
    )
}
import { View, Text, useColorScheme, TextInput, KeyboardAvoidingView, Platform, TouchableWithoutFeedback, Keyboard, TouchableOpacity } from 'react-native';
import Btn from '../components/CustomButton';
import StyleDefault from '../constants/DefaultStyles';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Colors } from '../constants/Colors';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome'
import { faPhone } from '@fortawesome/free-solid-svg-icons/faPhone'
import { faAngleLeft } from '@fortawesome/free-solid-svg-icons/faAngleLeft'
import { useState } from 'react';

export default function PhoneNumberScreen() {
    const router = useRouter();
    const colorScheme = useColorScheme();
    const defaultStyles = StyleDefault({ colorScheme });

    const [cc, setCC] = useState<string>("44");
    const [number, setNumber] = useState<string>("");

    const validPhoneNumber = "44111111111";

    return (
        <TouchableWithoutFeedback onPress={() => {Keyboard.dismiss()}}>
            <SafeAreaView style={{...defaultStyles.container, paddingHorizontal: 20,}}>
                <KeyboardAvoidingView style={{flex: 1,}} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
                    <View style={{flex: 5, paddingTop: 30,}}>
                        <Text style={defaultStyles.title}>Enter your mobile number</Text>
                        <Text style={{...defaultStyles.subtitle, marginTop: 10,}}>We'll check if you have an account or help you create one</Text>
                        <View style={{flexDirection: "row", marginTop: 20, gap: 4, height: 60}}>
                            <View style={{flex: 4, justifyContent: "center", borderTopLeftRadius: 15, borderBottomLeftRadius: 15,  backgroundColor: Colors[colorScheme ?? "light"].secondaryBackground}}>
                                <View style={{width: "100%", height: "100%", alignItems: "center", flexDirection: "row", gap: 8,}}>
                                    <View style={{marginLeft: 20}}>
                                        <FontAwesomeIcon icon={faPhone} size={14} color={Colors[colorScheme ?? "light"].secondaryText}/>
                                    </View>
                                    
                                    <View style={{ height: "100%", justifyContent: "center", alignItems: "center", flexDirection: "row", marginLeft: 10, gap: 5,}}>
                                        <Text style={{ fontSize: 16, fontFamily:'Outfit_400Regular', color: Colors[colorScheme ?? "light"].secondaryText}}>
                                            +
                                        </Text>
                                        <TextInput style={{fontSize: 16,  fontFamily:'Outfit_400Regular', height: "100%", width: 40, color: Colors[colorScheme ?? "light"].secondaryText}} placeholderTextColor={Colors[colorScheme ?? "light"].tertiaryText} keyboardType='number-pad' value={cc} onChangeText={setCC} placeholder="CC" selectionColor={Colors[colorScheme ?? "light"].secondaryText}/>
                                    </View>
                                    
                                </View>
                            </View>
                            <View style={{flex: 9, alignItems: "center", justifyContent: "center", borderTopRightRadius: 15, borderBottomRightRadius: 15, backgroundColor: Colors[colorScheme ?? "light"].secondaryBackground}}>
                                <TextInput style={{width: "90%", height: "80%", fontSize: 16, fontFamily:'Outfit_400Regular', color: Colors[colorScheme ?? "light"].secondaryText,}} keyboardType='number-pad' placeholderTextColor={Colors[colorScheme ?? "light"].tertiaryText} value={number} onChangeText={setNumber} placeholder='Phone Number' autoFocus selectionColor={Colors[colorScheme ?? "light"].secondaryText}/>
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
                            <Btn styleBtn={{width: "80%", borderRadius: 100,}} text="next" onPress={() => {
                                if (cc+number == validPhoneNumber) {
                                    router.navigate('login/password');
                                } else {
                                    router.navigate('register/email');
                                }
                                }} />
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </SafeAreaView>
        </TouchableWithoutFeedback>
    )
}
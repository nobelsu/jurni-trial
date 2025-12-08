import { View, Text, useColorScheme, KeyboardAvoidingView, Platform, TextInput } from 'react-native';
import Btn from '../../components/CustomButton';
import StyleDefault from '../../constants/DefaultStyles';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Colors } from '../../constants/Colors';

export default function LoginPasswordScreen() {
    const router = useRouter();
    const colorScheme = useColorScheme();
    const defaultStyles = StyleDefault({ colorScheme });

    return (
        <SafeAreaView style={{...defaultStyles.container, paddingHorizontal: 20,}}>
            <KeyboardAvoidingView style={{flex: 1,}} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
                <View style={{flex: 5, paddingTop: 30,}}>
                    <Text style={defaultStyles.title}>Enter your password</Text>
                    <Text style={{...defaultStyles.subtitle, marginTop: 10,}}>We found an account that matches your mobile number</Text>
                    <View style={{marginTop: 20, height: 50,}}>
                        <View style={{flex: 1,alignItems: "center", justifyContent: "center", borderWidth: 0, borderRadius: 15, backgroundColor: Colors[colorScheme ?? "light"].secondaryBackground}}>
                            <TextInput style={{width: "90%", height: "80%", fontSize: 14, }} placeholder='Password'/>
                        </View>
                    </View>
                </View>
                <View style={{flex: 1, justifyContent: "center", alignItems: "flex-end", width: "100%"}}>
                    <Btn styleBtn={{width: "40%", borderRadius: 100,}} styleTxt={{ fontWeight: 600,}} text="Login" onPress={() => {router.navigate('../home/map');}} />
                </View>
                </KeyboardAvoidingView>
        </SafeAreaView>
    )
}

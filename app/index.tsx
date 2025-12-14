import { View, Text, useColorScheme } from 'react-native';
import Btn from '../components/CustomButton';
import StyleDefault from '../constants/DefaultStyles';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Colors } from '../constants/Colors';
import { Dimensions } from 'react-native';

export default function GettingStartedScreen() {
    const router = useRouter();
    const colorScheme = useColorScheme();
    const defaultStyles = StyleDefault({ colorScheme });
    const windowWidth = Dimensions.get('window').width;
    const windowHeight = Dimensions.get('window').height;

    return (
        <SafeAreaView style={{...defaultStyles.container, paddingHorizontal: 20,}}>
            <View style={{flex: 1, paddingTop: 20, gap: 5,}}>
                <Text style={{fontSize: 14, fontFamily: "Outfit_900Black", color: Colors[colorScheme ?? "light"].primaryText}}>jurni</Text>
                <Text style={{fontSize: 14, fontFamily: "Outfit_900Black", color: Colors[colorScheme ?? "light"].primary}}>welcome</Text>
            </View> 
            <View style={{flex: 4, gap: 4, paddingTop: windowHeight*0.21,}}>
                <Text style={{fontSize: 20, fontFamily: "Outfit_400Regular", color: Colors[colorScheme ?? "light"].primaryText}}>more than a ride</Text>
                <View style={{alignItems: "center", width: "100%",}}>
                    <Text style={{fontSize: 48, fontFamily: "Outfit_900Black", color: Colors[colorScheme ?? "light"].primaryText}}>it's a <Text style={{color: Colors[colorScheme ?? "light"].primary}}>jurni.</Text></Text>
                </View>
            </View>
            <View style={{flex: 1, justifyContent: "center", alignItems: "center", width: "100%"}}>
                <Btn styleBtn={{}} text="get started" onPress={() => {router.navigate('phone_number');}} />
            </View>
        </SafeAreaView>
    )
}
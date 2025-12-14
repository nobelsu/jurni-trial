import { View, Text, TouchableOpacity } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { Colors } from "../../constants/Colors"
import { useColorScheme } from "react-native"
import { useNavigation, useRouter } from "expo-router"
import { DrawerActions } from "@react-navigation/native"
import { faBars } from "@fortawesome/free-solid-svg-icons/faBars"
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome"
import StyleDefault from "../../constants/DefaultStyles"
import Btn from "../../components/CustomButton"

export default function ProfileScreen() {
    const navigation = useNavigation()
    const colorScheme = useColorScheme()
    const defaultStyles = StyleDefault({colorScheme})
    const router = useRouter()

    return (
        <SafeAreaView style={{flex: 1,  backgroundColor: Colors[colorScheme ?? "light"].primaryBackground}}>
            <View style={{flex: 1, paddingHorizontal: 20, justifyContent: "center", alignItems: "center"}}>
                <TouchableOpacity onPress={() => {navigation.dispatch(DrawerActions.toggleDrawer())}} style={{
                    position: "absolute",
                    height: 50,
                    width: 50,
                    borderRadius: 100,
                    backgroundColor: Colors[colorScheme ?? "light"].secondaryBackground,
                    top: 0,
                    left: 20,
                    zIndex: 1000,
                    justifyContent: "center",
                    alignItems: "center",
                }}>
                    <FontAwesomeIcon icon={faBars} size={20} color={Colors[colorScheme ?? "light"].primary}/>
                </TouchableOpacity>

                <Text style={{...defaultStyles.title, marginBottom: 8}}>Page not found.</Text>
                <Text style={{...defaultStyles.subtitle, marginBottom: 60,}}>This is not an actual page...</Text>
                <Btn text="return home" onPress={() => {router.navigate("/")}}/>
            </View>
        </SafeAreaView>
    )
}
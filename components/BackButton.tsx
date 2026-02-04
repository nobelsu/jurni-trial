import { TouchableOpacity } from "react-native"
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome"
import { faAngleLeft } from "@fortawesome/free-solid-svg-icons/faAngleLeft"
import { useRouter } from "expo-router"
import { Colors } from "../constants/Colors"
import { useColorScheme } from "react-native"

interface BackBtnProps {
    onPress: () => void;
}

export default function BackBtn({onPress}: BackBtnProps) {
    const colorScheme = useColorScheme();
    return (
        <TouchableOpacity onPress={onPress} style={{padding: 16, borderRadius: "100%", backgroundColor: Colors[colorScheme ?? "light"].bgBtn}}>
            <FontAwesomeIcon icon={faAngleLeft} size={20} color={Colors[colorScheme ?? "light"].textBtn}/>
        </TouchableOpacity>
    )
}
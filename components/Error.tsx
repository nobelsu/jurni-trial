import { View, Text, TouchableOpacity, ViewStyle, TextStyle} from 'react-native';
import { Colors } from '../constants/Colors';
import { useColorScheme } from 'react-native';
import StyleDefault from '../constants/DefaultStyles';
import { faExclamationCircle } from '@fortawesome/free-solid-svg-icons/faExclamationCircle'
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome'

interface ErrorProps {
    message: string;
    styleError?: ViewStyle;
}

export default function Error({message, styleError}: ErrorProps) {
    const colorScheme = useColorScheme();
    const defaultStyles = StyleDefault({ colorScheme });
    return (
        <View style={{width: "100%", flexDirection: "row", alignItems: "center", gap: 6, ...styleError}}>
            <FontAwesomeIcon icon={faExclamationCircle} size={14} color={Colors[colorScheme ?? "light"].primary}/>
            <Text style={{
                color: Colors[colorScheme ?? "light"].primary, 
                fontFamily: "Outfit_400Regular",
                fontSize: 16,
            }}>{message}</Text>
        </View>
    )
}
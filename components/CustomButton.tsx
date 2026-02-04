import { Text, TouchableOpacity, ViewStyle, TextStyle} from 'react-native';
import { Colors } from '../constants/Colors';
import { useColorScheme } from 'react-native';

interface BtnProps {
    onPress?: () => void;
    text: string;
    styleBtn?: ViewStyle;
    styleTxt?: TextStyle;
}

export default function Btn({onPress, text, styleBtn, styleTxt}: BtnProps) {
    const colorScheme = useColorScheme();
 
    return (
        <TouchableOpacity 
            onPress={onPress} 
            style={{
                backgroundColor: Colors[colorScheme ?? "light"].primary,
                padding: 16,
                borderRadius: 18,
                justifyContent: "center",
                alignItems: "center",
                width: "100%",
                ...styleBtn
            }}
        >
            <Text style ={{
                color: colorScheme == "light" ? Colors["light"].bgDark : Colors["light"].bgLight,
                fontSize: 18,
                fontFamily:"Outfit_500Medium",
                ...styleTxt
            }}>
                {text}
            </Text>
        </TouchableOpacity>
    )
}
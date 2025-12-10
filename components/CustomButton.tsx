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
                padding: 15,
                borderRadius: 12,
                justifyContent: "center",
                alignItems: "center",
                width: "100%",
                ...styleBtn
            }}
        >
            <Text style ={{
                color: Colors[colorScheme ?? "light"].btnText,
                fontSize: 16,
                ...styleTxt
            }}>
                {text}
            </Text>
        </TouchableOpacity>
    )
}
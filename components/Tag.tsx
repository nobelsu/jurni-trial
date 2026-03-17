import { ColorSchemeName, Text, useColorScheme, View } from "react-native";
import { Colors } from "../constants/Colors";

interface TagProps {
    id: number
}

interface TagDataProps {
    colorScheme : ColorSchemeName   
}

function TagData({colorScheme} : TagDataProps) {
    const dataTag = [
        {
            bgColor: Colors[colorScheme ?? "light"].text,
            textColor: Colors[colorScheme ?? "light"].bgDark,
            text: "Faster"
        },
        {
            bgColor: Colors[colorScheme ?? "light"].primary,
            textColor: Colors["dark"].text,
            text: "Comfort"
        },
        {
            bgColor: Colors[colorScheme ?? "light"].bg,
            textColor: Colors[colorScheme ?? "light"].text,
            text: "Business"
        },
        {
            bgColor: Colors[colorScheme ?? "light"].bgLight,
            textColor: Colors["dark"].text,
            text: "Larger"
        },
        {
            bgColor: Colors[colorScheme ?? "light"].secondary,
            textColor: Colors["dark"].text,
            text: "WAV"            
        },
    ]

    return dataTag
}

export default function Tag({id}: TagProps) {
    const colorScheme = useColorScheme()
    const dataTag = TagData({colorScheme})

    return (
        <View style={{paddingVertical: 3, paddingHorizontal: 8, backgroundColor: dataTag[id].bgColor, alignSelf: "flex-start", borderRadius: 4,}}>
            <Text style={{color: dataTag[id].textColor, fontWeight: 500, fontSize: 16,}}>{dataTag[id].text}</Text>
        </View>
    )
}
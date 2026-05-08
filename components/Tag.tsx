import { ColorSchemeName, Text, useColorScheme, View } from "react-native";
import { Colors } from "../constants/Colors";

interface TagProps {
    id: number
}

interface TagDataProps {
    colorScheme : ColorSchemeName   
}

function TagData({colorScheme} : TagDataProps) {
    const themeKey: keyof typeof Colors = colorScheme === "dark" ? "dark" : "light";
    const dataTag = [
        {
            bgColor: Colors[themeKey].text,
            textColor: Colors[themeKey].bgDark,
            text: "Faster"
        },
        {
            bgColor: Colors[themeKey].primary,
            textColor: Colors["dark"].text,
            text: "Comfort"
        },
        {
            bgColor: Colors[themeKey].bg,
            textColor: Colors[themeKey].text,
            text: "Business"
        },
        {
            bgColor: Colors[themeKey].bgLight,
            textColor: Colors["dark"].text,
            text: "Larger"
        },
        {
            bgColor: Colors[themeKey].secondary,
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
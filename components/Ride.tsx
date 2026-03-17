import { Text, TouchableOpacity, useColorScheme, View } from "react-native";
import Tag from "./Tag";
import { Colors } from "../constants/Colors";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { faUser } from '@fortawesome/free-solid-svg-icons/faUser'
import { useBottomSheet } from "@gorhom/bottom-sheet";
import { calculatePickupTime, calculateRideCost, RideTypeId } from "../lib/cost";
import { rideTypeMetadata } from "../constants/MockData";

interface RideComponentProps {
    id: RideTypeId,
    selected: RideTypeId,
    setSelected?: React.Dispatch<React.SetStateAction<RideTypeId>>,
    nextRef: any,
    setPhase: React.Dispatch<React.SetStateAction<number>>,
    mapRef: any,
    distance: number,
    duration: number
}

export default function RideComponent({id, selected, setSelected, nextRef, setPhase, mapRef, distance, duration}: RideComponentProps) {
    const { forceClose } = useBottomSheet();

    if (!rideTypeMetadata[id]) return null

    const colorScheme = useColorScheme();

    return (
        <TouchableOpacity 
            onPress={() => {
                if (id == selected) {
                    setPhase(2)
                    forceClose()
                    nextRef.current?.snapToIndex(0)
                }
                if (!setSelected) return
                else if (id != selected) setSelected(id);
            }}
            style={{width: "100%", padding: 10, justifyContent: "center", alignItems: "center", borderRadius: 15, borderWidth: 3, borderColor: (id == selected) ? Colors[colorScheme ?? "light"].text : Colors[colorScheme ?? "light"].bgDark}}>
            <View style={{flexDirection: "row"}}>
                <View style={{height: 50, width: 80}}>
                </View>
                <View style={{flex: 2, gap: 8,}}>
                    <View style={{flexDirection: "row", alignItems: "center"}}>
                        <Text style={{color: Colors[colorScheme ?? "light"].text, fontSize: 18, fontWeight: 600, marginRight: 10,}}>{rideTypeMetadata[id]?.name}</Text>
                        <FontAwesomeIcon icon={faUser} size={12} color={Colors[colorScheme ?? "light"].text} style={{marginRight: 4,}} />
                        <Text style={{color: Colors[colorScheme ?? "light"].text, fontSize: 14,}}>{rideTypeMetadata[id]?.passengers}</Text>
                    </View>
                    <View style={{flexDirection: "row", gap: 10,}}>
                        <Text style={{color: Colors[colorScheme ?? "light"].text, fontSize: 16,}}>{calculatePickupTime(rideTypeMetadata[id])}</Text>
                        <Text style={{color: Colors[colorScheme ?? "light"].text, fontSize: 16,}}>{rideTypeMetadata[id]?.time} min</Text>
                    </View>
                    {rideTypeMetadata[id]?.tags.map((tagId) => {
                        return (<Tag key={tagId} id={tagId}/>)
                    })}
                </View>
                <View style={{flex: 1}}>
                    <Text style={{top: 0, right: 0, position: "absolute", color: Colors[colorScheme ?? "light"].text, fontWeight: 500, fontSize: 18,}}>{`£${calculateRideCost(rideTypeMetadata[id], distance, duration).toFixed(2)}`}</Text>
                </View>
            </View>
        </TouchableOpacity>
    )
}
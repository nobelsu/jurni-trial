import { Text, TouchableOpacity, useColorScheme, View } from "react-native";
import Tag from "./Tag";
import { Colors } from "../constants/Colors";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { faUser } from '@fortawesome/free-solid-svg-icons/faUser'
import { useBottomSheet } from "@gorhom/bottom-sheet";
import { calculatePickupTime, calculateRideCost, RideTypeId } from "../lib/cost";
import { rideTypeMetadata } from "../constants/MockData";
import { MAPBOX_ACCESS_TOKEN, Position } from "../lib/mapbox";
import axios from "axios";

interface RideComponentProps {
    id: RideTypeId,
    selected: RideTypeId,
    setSelected?: React.Dispatch<React.SetStateAction<RideTypeId>>,
    nextRef: any,
    setPhase: React.Dispatch<React.SetStateAction<number>>,
    mapRef: any,
    distance: number,
    duration: number,
    pickupCoords: Position,
    setPickupInput: React.Dispatch<React.SetStateAction<string>>,
}

export default function RideComponent({id, selected, setSelected, nextRef, setPhase, mapRef, distance, duration, pickupCoords, setPickupInput}: RideComponentProps) {
    const { forceClose } = useBottomSheet();

    if (!rideTypeMetadata[id]) return null

    const colorScheme = useColorScheme();

    async function reverseGeocodePickupForConfirm(coords: Position) {
        try {
            const url = "https://api.mapbox.com/search/geocode/v6/reverse";
            const res = await axios.get(url, {
                params: {
                    access_token: MAPBOX_ACCESS_TOKEN,
                    longitude: coords[0],
                    latitude: coords[1],
                }
            });
            const feature = res.data?.features?.[0];
            const properties = feature?.properties ?? {};
            const preferredName: string =
                properties.name_preferred ??
                properties.name ??
                properties.place_formatted ??
                feature?.place_name ??
                "";

            if (preferredName) {
                setPickupInput(preferredName);
            }
        } catch (err) {
            console.log("Geocoding reverse lookup for confirm failed", err);
        }
    }

    return (
        <TouchableOpacity 
            onPress={async () => {
                if (id == selected) {
                    await reverseGeocodePickupForConfirm(pickupCoords);
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
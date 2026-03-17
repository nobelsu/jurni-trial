import { BottomSheetTextInput, TouchableOpacity, useBottomSheet } from "@gorhom/bottom-sheet";
import { Dimensions, Text, useColorScheme, View } from "react-native";
import Animated, { useAnimatedReaction, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { Colors } from "../constants/Colors";
import StyleDefault from '../constants/DefaultStyles';
import { faMagnifyingGlass } from "@fortawesome/free-solid-svg-icons/faMagnifyingGlass";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import Btn from "./CustomButton";
import { MAPBOX_ACCESS_TOKEN, obtainDirections, obtainWalkingDirections, Position } from "../lib/mapbox";
import { computeBBox, isSinglePoint } from "../lib/shared-util";
import { Camera, MapView } from "@rnmapbox/maps";
import * as turf from "@turf/turf"
import axios from "axios";

interface SetLocationProps {
    toggle: boolean, // false for pickup, true for dest
    setToggle: React.Dispatch<React.SetStateAction<boolean>>,
    pickupInput: string,
    destInput: string,
    setPickupInput: React.Dispatch<React.SetStateAction<string>>,
    setDestInput: React.Dispatch<React.SetStateAction<string>>,
    pickupCoords: Position,
    destCoords: Position,
    moving: boolean,
    nextRef: any,
    setDistance: React.Dispatch<React.SetStateAction<number>>,
    setDuration: React.Dispatch<React.SetStateAction<number>>,
    setPhase: React.Dispatch<React.SetStateAction<number>>,
    setCoordinates: React.Dispatch<React.SetStateAction<Position[]>>,
    setWalkingCoordinates: React.Dispatch<React.SetStateAction<Position[]>>,
    setPickupCoords: React.Dispatch<React.SetStateAction<Position>>,
    cameraRef: React.RefObject<Camera|null>,
    setSw: React.Dispatch<React.SetStateAction<Position | undefined>>,
    setNe: React.Dispatch<React.SetStateAction<Position | undefined>>,
    userLocation: Position,
}

async function obtainAddress(coords: Position,) {
    const url = "https://api.mapbox.com/search/geocode/v6/reverse";
    return await axios.get(url, {
        params: {
            access_token: MAPBOX_ACCESS_TOKEN,
            longitude: coords[0],
            latitude: coords[1],
        }
    })
}

export default function SetLocation({ 
    nextRef, 
    toggle, 
    setToggle, 
    pickupInput, 
    setPickupInput, 
    destInput, 
    setDestInput, 
    pickupCoords, 
    destCoords, 
    moving, 
    setPhase, 
    setCoordinates, 
    setWalkingCoordinates,
    setPickupCoords,
    cameraRef, 
    setSw,
    setNe,
    setDistance,
    setDuration,
    userLocation
}: SetLocationProps) {
    const { animatedPosition, animatedIndex, snapToIndex, forceClose } = useBottomSheet();
    const opacity = useSharedValue(1);

    const animatedStyle = useAnimatedStyle(() => {
        return { opacity: opacity.value };
    });
    
    useAnimatedReaction(
        () => animatedPosition.value,
            (currentPosition, previousPosition) => {
                "worklet";
                if (!previousPosition) return
                let curr = +(Math.round(Math.abs(currentPosition))/434.0).toFixed(1);
                let prev = +(Math.round(Math.abs(previousPosition))/434.0).toFixed(1);
                if (curr !== prev && curr <= 1.00 && opacity.value != curr) {
                    opacity.value = withTiming(curr, { duration: 10 });
                }
            },
            [animatedPosition],
    );

    const windowWidth = Dimensions.get('window').width;
    const colorScheme = useColorScheme();
    const defaultStyles = StyleDefault({ colorScheme });

    const titleText = toggle ? " destination" : " pick-up location";
    const placeholderText = toggle ? "Where to?" : "Pickup Location";
    const btnText = toggle ? "destination" : "pickup";

    return (
        <Animated.View style={{opacity: opacity, position: "absolute", left: 0, top: 0, zIndex: 10000,}}>
            <View style={{
                width: windowWidth,
                alignItems: 'center',
                paddingHorizontal: 20,
                paddingVertical: 10,
                backgroundColor: Colors[colorScheme ?? "light"].bgDark,
                marginBottom: 10,
            }}>
                <Text style={defaultStyles.title}>Set your{titleText}</Text>
                <Text style={defaultStyles.subtitle}>Drag the map to move the pin</Text>
                <TouchableOpacity style={{ 
                    width: "100%", 
                    borderRadius: 10, 
                    marginTop: 15, 
                    paddingVertical: 10, 
                    backgroundColor: Colors[colorScheme ?? "light"].bg,
                    opacity: moving ? 0.6 : 1,
                }}
                onPress={() => {
                    snapToIndex(1);
                }}
                >
                    <View style={{
                        height: 26, 
                        alignItems: "center", 
                        justifyContent: "center", 
                        flexDirection: "row", 
                        gap: 12,
                    }}>
                        <FontAwesomeIcon 
                            icon={faMagnifyingGlass} 
                            size={14} 
                            color={Colors[colorScheme ?? "light"].textDull}
                        />
                        <BottomSheetTextInput 
                            style={{
                                width: "80%", 
                                height: "100%", 
                                fontSize: 18,
                                color: Colors[colorScheme ?? "light"].textDull, 
                                fontFamily:'Outfit_400Regular'
                            }} 
                            selectTextOnFocus
                            placeholderTextColor={Colors[colorScheme ?? "light"].textDull} 
                            placeholder={placeholderText}
                            value={toggle ? destInput : pickupInput} 
                            onChangeText={toggle ? setDestInput : setPickupInput}
                            editable={false}
                            pointerEvents="none"
                        />
                    </View>
                </TouchableOpacity>
                <Btn styleBtn={{marginTop: 20,}} text={"Confirm " + btnText} onPress={async () => {
                    if (destInput && pickupInput) {
                        const data = await obtainDirections(pickupCoords, destCoords)
                        var line = turf.lineString(data.coordinates);
                        var curved = turf.bezierSpline(line, {resolution: 10000});
                        setCoordinates(curved.geometry.coordinates as Position[]);
                        
                        setPickupCoords(curved.geometry.coordinates[0] as Position);
                        const res = await obtainAddress(curved.geometry.coordinates[0] as Position);
                        setPickupInput(res.data.features[0].properties.name_preferred);

                        const walkingCoordinates = await obtainWalkingDirections(curved.geometry.coordinates[0] as Position, userLocation)
                        // var line2 = turf.lineString(walkingCoordinates);
                        // var curved2 = turf.bezierSpline(line2, {resolution: 10000});
                        // setWalkingCoordinates(curved2.geometry.coordinates as Position[]);
                        setWalkingCoordinates(walkingCoordinates)

                        const bbox = computeBBox(data.coordinates)
                        setSw([bbox.minLat, bbox.minLng])
                        setNe([bbox.maxLat, bbox.maxLng])
                        setDistance(data.distance)
                        setDuration(data.duration)
                        cameraRef.current?.fitBounds([bbox.maxLat, bbox.maxLng], [bbox.minLat, bbox.minLng], [70, 70, 120, 70], 800)

                        setPhase(1);
                        forceClose();
                        nextRef.current?.snapToIndex(0)
                    } else if (pickupInput && !toggle) setToggle(true);
                    else if (destInput && toggle) setToggle(false);
                }}
                disabled={(!pickupInput && !toggle) || (!destInput && toggle)}
                />
            </View>                  
        </Animated.View>
    )
}
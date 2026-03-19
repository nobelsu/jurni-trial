import { useBottomSheet } from "@gorhom/bottom-sheet";
import { Dimensions, Text, TouchableOpacity, useColorScheme, View } from "react-native";
import Animated, { useAnimatedReaction, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import StyleDefault from "../constants/DefaultStyles";
import { Colors } from "../constants/Colors";
import Tag from "./Tag";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { faAngleRight } from '@fortawesome/free-solid-svg-icons/faAngleRight'
import RideComponent from "./Ride";
import { RideTypeId } from "../lib/cost";
import { Position } from "../lib/mapbox";

interface ChooseRideProps {
    selectedId: RideTypeId,
    nextRef: any,
    mapRef: any,
    setPhase: React.Dispatch<React.SetStateAction<number>>,
    distance: number,
    duration: number,
    silentOnly: boolean,
    pickupCoords: Position,
    setPickupInput: React.Dispatch<React.SetStateAction<string>>,
}

export default function ChooseRide({selectedId, nextRef, setPhase, mapRef, distance, duration, silentOnly, pickupCoords, setPickupInput} : ChooseRideProps) {
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
                let curr = +(Math.round(Math.abs(currentPosition) - 94.0)/280.0).toFixed(1);
                let prev = +(Math.round(Math.abs(previousPosition) - 94.0)/280.0).toFixed(1);
                if (curr !== prev && curr <= 1.00 && opacity.value != curr) {
                    opacity.value = withTiming(curr, { duration: 10 });
                }
            },
            [animatedPosition],
    );

    const windowWidth = Dimensions.get('window').width;
    const colorScheme = useColorScheme();
    const defaultStyles = StyleDefault({ colorScheme });

    return (
        <Animated.View style={{opacity: opacity, position: "absolute", left: 0, top: 0, zIndex: 10000}}>            
            <View style={{
                width: windowWidth,
                paddingVertical: 10,
                backgroundColor: Colors[colorScheme ?? "light"].bgDark,
            }}>
                <View style={{width: "100%", paddingHorizontal: 20, justifyContent: "center", alignItems: "center"}}>
                    <Text style={{...defaultStyles.title, marginBottom: 8,}}>Your <Text style={{color: Colors[colorScheme ?? "light"].primary }}>ride</Text></Text>
                    <RideComponent id={selectedId} selected={selectedId} nextRef={nextRef} setPhase={setPhase} mapRef={mapRef} distance={distance} duration={duration} pickupCoords={pickupCoords} setPickupInput={setPickupInput}/>
                </View>
            </View>             
        </Animated.View>
    )
}
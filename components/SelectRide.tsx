import { BottomSheetScrollView, useBottomSheet } from "@gorhom/bottom-sheet";
import { Dimensions, Switch, Text, TouchableOpacity, useColorScheme, View } from "react-native";
import Animated, { useAnimatedReaction, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import StyleDefault from "../constants/DefaultStyles";
import { Colors } from "../constants/Colors";
import Tag from "./Tag";
import { faAngleRight } from "@fortawesome/free-solid-svg-icons/faAngleRight";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { ScrollView } from "react-native-gesture-handler";
import RideComponent from "./Ride";
import { RideTypeId } from "../lib/cost";
import { Position } from "../lib/mapbox";

interface SelectRideProps {
    selectedId: RideTypeId,
    setSelected: React.Dispatch<React.SetStateAction<RideTypeId>>,
    nextRef: any,
    mapRef: any,
    setPhase: React.Dispatch<React.SetStateAction<number>>,
    distance: number,
    duration: number,
    silentOnly: boolean,
    setSilentOnly: React.Dispatch<React.SetStateAction<boolean>>,
    pickupCoords: Position,
    setPickupInput: React.Dispatch<React.SetStateAction<string>>,
}

export default function SelectRide({selectedId, setSelected, nextRef, mapRef, setPhase, distance, duration, silentOnly, setSilentOnly, pickupCoords, setPickupInput} : SelectRideProps) {
    const { animatedPosition, animatedIndex, snapToIndex, forceClose } = useBottomSheet();
    const opacity = useSharedValue(0);

    const animatedStyle = useAnimatedStyle(() => {
        return { opacity: opacity.value };
    });

    const rideIds = ["basic", "plus", "exec", "xl", "access"] as RideTypeId[]
    
    useAnimatedReaction(
        () => animatedPosition.value,
            (currentPosition, previousPosition) => {
                "worklet";
                if (!previousPosition) return
                let curr = +(Math.round(Math.abs(currentPosition) - 94.0)/280.0).toFixed(1);
                let prev = +(Math.round(Math.abs(previousPosition) - 94.0)/280.0).toFixed(1);
                if (curr !== prev && curr <= 1.00 && opacity.value != curr) {
                    opacity.value = withTiming(1-curr, { duration: 10 });
                }
            },
            [animatedPosition],
    );

    const windowWidth = Dimensions.get('window').width;
    const colorScheme = useColorScheme();
    const defaultStyles = StyleDefault({ colorScheme });

    return (
        <Animated.View style={{opacity: opacity, position: "absolute", left: 0, top: 0, zIndex: 10000,}}>
            <View style={{
                width: windowWidth,
                paddingTop: 10,
                backgroundColor: Colors[colorScheme ?? "light"].bgDark,
                marginBottom: 10,
            }}>
                <View style={{width: "100%", paddingHorizontal: 20, justifyContent: "center", alignItems: "center"}}>
                    <Text style={{...defaultStyles.title, marginBottom: 15,}}>Select a <Text style={{color: Colors[colorScheme ?? "light"].primary}}>ride</Text></Text>
                    <View
                        style={{
                            width: "100%",
                            flexDirection: "row",
                            alignItems: "center",
                            justifyContent: "space-between",
                            paddingVertical: 8,
                            marginBottom: 8,
                        }}
                    >
                        <View style={{ flex: 1 }}>
                            <Text style={{ ...defaultStyles.title, fontSize: 14 }}>
                                Quiet rides
                            </Text>
                            <Text style={{ ...defaultStyles.subtitle, fontSize: 12 }}>
                                Prefer less conversation during trips
                            </Text>
                        </View>
                        <Switch
                            value={silentOnly}
                            onValueChange={setSilentOnly}
                            trackColor={{
                                false: Colors[colorScheme ?? "light"].bg,
                                true: Colors[colorScheme ?? "light"].primary,
                            }}
                            thumbColor={Colors[colorScheme ?? "light"].bgDark}
                        />
                    </View>
                    <BottomSheetScrollView style={{width: "100%", height: 329}}>
                        {rideIds.map((id) => {
                            return (<RideComponent id={id} key={`${id}`} selected={selectedId} setSelected={setSelected} setPhase={setPhase} nextRef={nextRef} mapRef={mapRef} distance={distance} duration={duration} pickupCoords={pickupCoords} setPickupInput={setPickupInput}/>)
                        })}
                    </BottomSheetScrollView>
                </View>
            </View>              
        </Animated.View>
    )
}
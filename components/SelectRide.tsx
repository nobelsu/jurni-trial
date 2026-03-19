import { BottomSheetScrollView, useBottomSheet } from "@gorhom/bottom-sheet";
import React from "react";
import { Dimensions, Modal, Switch, Text, TouchableOpacity, useColorScheme, View } from "react-native";
import Animated, { useAnimatedReaction, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import StyleDefault from "../constants/DefaultStyles";
import { Colors } from "../constants/Colors";
import Tag from "./Tag";
import { faEllipsisVertical } from "@fortawesome/free-solid-svg-icons/faEllipsisVertical";
import { faTimes } from "@fortawesome/free-solid-svg-icons/faTimes";
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
    femaleDriverPreferred: boolean,
    setFemaleDriverPreferred: React.Dispatch<React.SetStateAction<boolean>>,
    optionsVisible: boolean,
    setOptionsVisible: (visible: boolean) => void,
}

export default function SelectRide({
    selectedId,
    setSelected,
    nextRef,
    mapRef,
    setPhase,
    distance,
    duration,
    silentOnly,
    setSilentOnly,
    pickupCoords,
    setPickupInput,
    femaleDriverPreferred,
    setFemaleDriverPreferred,
    optionsVisible,
    setOptionsVisible,
}: SelectRideProps) {
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
                    <BottomSheetScrollView style={{width: "100%", height: 391}}> 
                        {rideIds.map((id) => {
                            return (<RideComponent id={id} key={`${id}`} selected={selectedId} setSelected={setSelected} setPhase={setPhase} nextRef={nextRef} mapRef={mapRef} distance={distance} duration={duration} pickupCoords={pickupCoords} setPickupInput={setPickupInput}/>)
                        })}
                    </BottomSheetScrollView>
                </View>
            </View>
            <Modal
                visible={optionsVisible}
                animationType="fade"
                transparent={true}
                onRequestClose={() => setOptionsVisible(false)}
            >
                <View
                    style={{
                        flex: 1,
                        backgroundColor: "rgba(0,0,0,0.5)",
                        justifyContent: "flex-end",
                    }}
                >
                    <TouchableOpacity
                        style={{ flex: 1 }}
                        activeOpacity={1}
                        onPress={() => setOptionsVisible(false)}
                    />
                    <View
                        style={{
                            backgroundColor: Colors[colorScheme ?? "light"].bgDark,
                            borderTopLeftRadius: 24,
                            borderTopRightRadius: 24,
                            paddingHorizontal: 20,
                            paddingTop: 16,
                            paddingBottom: 32,
                        }}
                    >
                        <View
                            style={{
                                flexDirection: "row",
                                alignItems: "center",
                                marginBottom: 16,
                            }}
                        >
                            <Text style={{ ...defaultStyles.title, flex: 1 }}>
                                Ride options
                            </Text>
                            <TouchableOpacity
                                onPress={() => setOptionsVisible(false)}
                                style={{
                                    height: 32,
                                    width: 32,
                                    borderRadius: 16,
                                    justifyContent: "center",
                                    alignItems: "center",
                                    backgroundColor: Colors[colorScheme ?? "light"].bg,
                                }}
                                hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                            >
                                <FontAwesomeIcon
                                    icon={faTimes}
                                    size={14}
                                    color={Colors[colorScheme ?? "light"].text}
                                />
                            </TouchableOpacity>
                        </View>
                        <View
                            style={{
                                borderRadius: 20,
                                backgroundColor: Colors[colorScheme ?? "light"].bg,
                                paddingHorizontal: 16,
                                paddingVertical: 14,
                                marginBottom: 12,
                            }}
                        >
                            <View
                                style={{
                                    flexDirection: "row",
                                    alignItems: "center",
                                }}
                            >
                                <View style={{ flex: 1, paddingRight: 12 }}>
                                    <Text style={{ ...defaultStyles.title, fontSize: 15 }}>
                                        Quiet rides
                                    </Text>
                                    <Text
                                        style={{
                                            ...defaultStyles.subtitle,
                                            fontSize: 12,
                                            marginTop: 2,
                                        }}
                                    >
                                        Prefer less conversation during trips
                                    </Text>
                                </View>
                                <Switch
                                    value={silentOnly}
                                    onValueChange={setSilentOnly}
                                    trackColor={{
                                        false: Colors[colorScheme ?? "light"].bgDark,
                                        true: Colors[colorScheme ?? "light"].primary,
                                    }}
                                    thumbColor={Colors[colorScheme ?? "light"].bgDark}
                                />
                            </View>
                        </View>
                        <View
                            style={{
                                borderRadius: 20,
                                backgroundColor: Colors[colorScheme ?? "light"].bg,
                                paddingHorizontal: 16,
                                paddingVertical: 14,
                            }}
                        >
                            <View
                                style={{
                                    flexDirection: "row",
                                    alignItems: "center",
                                }}
                            >
                                <View style={{ flex: 1, paddingRight: 12 }}>
                                    <Text style={{ ...defaultStyles.title, fontSize: 15 }}>
                                        Female driver
                                    </Text>
                                    <Text
                                        style={{
                                            ...defaultStyles.subtitle,
                                            fontSize: 12,
                                            marginTop: 2,
                                        }}
                                    >
                                        Prefer matching with a female driver when available
                                    </Text>
                                </View>
                                <Switch
                                    value={femaleDriverPreferred}
                                    onValueChange={setFemaleDriverPreferred}
                                    trackColor={{
                                        false: Colors[colorScheme ?? "light"].bgDark,
                                        true: Colors[colorScheme ?? "light"].primary,
                                    }}
                                    thumbColor={Colors[colorScheme ?? "light"].bgDark}
                                />
                            </View>
                        </View>
                    </View>
                </View>
            </Modal>
        </Animated.View>
    )
}
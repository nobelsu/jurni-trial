import { BottomSheetTextInput, BottomSheetView, TouchableOpacity, useBottomSheet } from "@gorhom/bottom-sheet";
import { Dimensions, Text, useColorScheme, View } from "react-native";
import { Colors } from "../constants/Colors";
import StyleDefault from "../constants/DefaultStyles";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { faMagnifyingGlass } from "@fortawesome/free-solid-svg-icons/faMagnifyingGlass";
import { faAngleLeft } from "@fortawesome/free-solid-svg-icons/faAngleLeft";
import firestore from "@react-native-firebase/firestore";
import { RideTypeId } from "../lib/cost";
import { useState } from "react";
import type { Position } from "../lib/mapbox";
import { addToPickupHistory, addToDestinationHistory, SearchHistoryEntry } from "../lib/users";
import { reverseGeocodeWithCache } from "../lib/searchCache";
import { useRouter } from "expo-router";

interface ConfirmPickupProps {
    pickupInput: string,
    setPickupInput: React.Dispatch<React.SetStateAction<string>>,
    destInput: string,
    moving: boolean,
    prevRef: any,
    setPhase: React.Dispatch<React.SetStateAction<number>>,
    riderId: string | undefined,
    price: number,
    typeId: RideTypeId,
    pickupCoords: Position,
    destCoords: Position,
    silentOnly: boolean,
    femaleDriverPreferred: boolean,
    verified: boolean,
    processing: boolean,
}

const DUMMY_DRIVER_ID = "dummy_driver_1";

export default function ConfirmPickup({
    pickupInput,
    setPickupInput,
    destInput,
    moving,
    prevRef,
    setPhase,
    riderId,
    price,
    typeId,
    pickupCoords,
    destCoords,
    silentOnly,
    femaleDriverPreferred,
    verified,
    processing,
}: ConfirmPickupProps) {

    const { forceClose } = useBottomSheet();
    const router = useRouter();
    const [paying, setPaying] = useState(false);
    const [payError, setPayError] = useState<string | null>(null);

    const windowWidth = Dimensions.get('window').width;
    const colorScheme = useColorScheme();
    const defaultStyles = StyleDefault({ colorScheme });

    async function handleConfirmAndPay() {
        if (!riderId) {
            setPayError("Please sign in to confirm and pay.");
            return;
        }
        if (femaleDriverPreferred && !verified) {
            setPayError("Please verify your identity in settings before requesting a female driver.");
            forceClose();
            router.push("/home/settings/verification");
            return;
        }
        setPayError(null);
        setPaying(true);
        try {
            const timestamp = firestore.FieldValue.serverTimestamp();

            const hasPickupCoords =
                Array.isArray(pickupCoords) &&
                pickupCoords.length >= 2 &&
                pickupCoords[0] !== -1 &&
                pickupCoords[1] !== -1;
            const hasDestCoords =
                Array.isArray(destCoords) &&
                destCoords.length >= 2 &&
                destCoords[0] !== -1 &&
                destCoords[1] !== -1;

            let finalPickupLabel = pickupInput ?? "";
            if (hasPickupCoords) {
                try {
                    const label = await reverseGeocodeWithCache(pickupCoords);
                    if (label?.name) {
                        finalPickupLabel = label.name;
                    }
                } catch {
                    // Best-effort: ignore reverse geocode failure; fall back to existing pickupInput.
                }
            }

            const pickup_geopoint = hasPickupCoords
                ? new firestore.GeoPoint(pickupCoords[1], pickupCoords[0])
                : null;
            const destination_geopoint = hasDestCoords
                ? new firestore.GeoPoint(destCoords[1], destCoords[0])
                : null;

            await firestore().collection("rides").add({
                accepted_at: timestamp,
                created_at: timestamp,
                driver_id: DUMMY_DRIVER_ID,
                ended_at: null,
                female_driver_preferred: !!femaleDriverPreferred,
                price,
                rider_id: riderId,
                started_at: timestamp,
                status: "RIDING",
                type_id: typeId,
                pickup: pickupInput || null,
                destination: destInput || null,
                pickup_geopoint,
                destination_geopoint,
                silent_only: !!silentOnly,
            });

            try {
                const pickupEntry: SearchHistoryEntry | null =
                    pickup_geopoint && finalPickupLabel
                        ? {
                            name: finalPickupLabel,
                            full_address: finalPickupLabel,
                            coords: [pickup_geopoint.longitude, pickup_geopoint.latitude],
                        }
                        : null;

                const destinationEntry: SearchHistoryEntry | null =
                    destination_geopoint && destInput
                        ? {
                            name: destInput,
                            full_address: destInput,
                            coords: [destination_geopoint.longitude, destination_geopoint.latitude],
                        }
                        : null;

                const promises: Promise<void>[] = [];
                if (pickupEntry) {
                    promises.push(addToPickupHistory(riderId, pickupEntry));
                }
                if (destinationEntry) {
                    promises.push(addToDestinationHistory(riderId, destinationEntry));
                }
                if (promises.length > 0) {
                    await Promise.all(promises);
                }
            } catch (e) {
                // Best-effort: ignore history write failures
                console.log("Failed to update search history from ride", e);
            }
            setPhase(3);
            forceClose();
        } catch (e) {
            setPayError(e instanceof Error ? e.message : "Failed to create ride. Please try again.");
        } finally {
            setPaying(false);
        }
    }

    return (
        <BottomSheetView>
            <View style={{
                width: windowWidth,
                alignItems: 'center',
                paddingHorizontal: 20,
                paddingVertical: 10,
                backgroundColor: Colors[colorScheme ?? "light"].bgDark,
                marginBottom: 10,
            }}>
                <Text style={defaultStyles.title}>Confirm pick-up spot</Text>
                <Text style={defaultStyles.subtitle}>Drag the map to move the pin</Text>
                <TouchableOpacity style={{ 
                    width: "100%", 
                    borderRadius: 10, 
                    marginTop: 15, 
                    paddingVertical: 10, 
                    backgroundColor: Colors[colorScheme ?? "light"].bg,
                    opacity: (moving || processing) ? 0.6 : 1,
                }}
                onPress={() => {
                    
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
                            value={pickupInput} 
                            onChangeText={setPickupInput}
                            editable={false}
                            pointerEvents="none"
                        />
                    </View>
                </TouchableOpacity>
                {payError ? (
                    <Text style={{ marginTop: 12, color: "#c00", fontSize: 14 }}>{payError}</Text>
                ) : null}
                <View style={{marginTop: 20, flexDirection: "row", gap: 8,}}>
                    <TouchableOpacity 
                        onPress={() => {
                            setPhase(1)
                            forceClose();
                            prevRef.current?.snapToIndex(0)
                        }}
                        disabled={paying}
                        style={{width: 50, height: 50, backgroundColor: Colors[colorScheme ?? "light"].bgBtn, borderRadius: 10, justifyContent: "center", alignItems: "center", opacity: paying ? 0.6 : 1}}>
                        <FontAwesomeIcon icon={faAngleLeft} size={20} color={Colors[colorScheme ?? "light"].textBtn}/>
                    </TouchableOpacity>
                    <TouchableOpacity 
                        onPress={handleConfirmAndPay}
                        disabled={paying}
                        style={{flex: 1, height: 50, backgroundColor: Colors[colorScheme ?? "light"].primary, borderRadius: 10, justifyContent: "center", alignItems: "center", opacity: paying ? 0.6 : 1}}>
                        <Text style={{fontSize: 18, fontWeight: 500, color: colorScheme == "light" ? Colors["light"].bgDark : Colors["light"].bgLight,}}>
                            {paying ? "Processing…" : "Confirm and pay"}
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>   
        </BottomSheetView>
    )
}
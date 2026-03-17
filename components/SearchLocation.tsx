import { BottomSheetScrollView, BottomSheetTextInput, useBottomSheet } from "@gorhom/bottom-sheet";
import { ActivityIndicator, Dimensions, Modal, Text, TouchableOpacity, useColorScheme, View } from "react-native";
import { Colors } from "../constants/Colors";
import StyleDefault from "../constants/DefaultStyles";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { faLocationDot } from "@fortawesome/free-solid-svg-icons/faLocationDot";
import { faMap } from "@fortawesome/free-solid-svg-icons/faMap";
import { faMapPin } from "@fortawesome/free-solid-svg-icons/faMapPin";
import { faMagnifyingGlass } from "@fortawesome/free-solid-svg-icons/faMagnifyingGlass";
import { faStar as faStarSolid } from "@fortawesome/free-solid-svg-icons/faStar";
import { faXmark } from "@fortawesome/free-solid-svg-icons/faXmark";
import { faClock } from "@fortawesome/free-regular-svg-icons/faClock";
import { faStar as faStarRegular } from "@fortawesome/free-regular-svg-icons/faStar";
import { useAnimatedReaction, useSharedValue, withTiming } from "react-native-reanimated";
import { useEffect, useRef, useState } from "react";
import { searchPlaces, SearchResult, Position } from "../lib/mapbox";
import {
  getPickupHistory,
  getDestinationHistory,
  getFavourites,
  toggleFavourite,
  SearchHistoryEntry,
} from "../lib/users";

interface SearchLocationProps {
    pickupRef: any,
    destRef: any,
    toggle: boolean,
    setToggle: React.Dispatch<React.SetStateAction<boolean>>,
    pickupInput: string,
    setPickupInput: React.Dispatch<React.SetStateAction<string>>,
    destInput: string,
    setDestInput: React.Dispatch<React.SetStateAction<string>>,
    setPickupCoords: React.Dispatch<React.SetStateAction<Position>>,
    setDestCoords: React.Dispatch<React.SetStateAction<Position>>,
    userLocation: Position,
    userId: string | undefined,
}

export default function SearchLocation({
    pickupRef,
    destRef,
    toggle,
    setToggle,
    pickupInput,
    setPickupInput,
    destInput,
    setDestInput,
    setPickupCoords,
    setDestCoords,
    userLocation,
    userId,
}: SearchLocationProps) {
    const windowWidth = Dimensions.get('window').width;
    const colorScheme = useColorScheme();
    const defaultStyles = StyleDefault({ colorScheme });
    const { animatedPosition, snapToIndex } = useBottomSheet();
    const opacity = useSharedValue(0);

    const [results, setResults] = useState<SearchResult[]>([]);
    const [searching, setSearching] = useState(false);
    const [pickupHistory, setPickupHistory] = useState<SearchHistoryEntry[]>([]);
    const [destinationHistory, setDestinationHistory] = useState<SearchHistoryEntry[]>([]);
    const [favourites, setFavourites] = useState<SearchHistoryEntry[]>([]);
    const [favouritesVisible, setFavouritesVisible] = useState(false);
    const [isPickupFocused, setIsPickupFocused] = useState(false);
    const [isDestFocused, setIsDestFocused] = useState(false);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useAnimatedReaction(
        () => animatedPosition.value,
        (currentPosition, previousPosition) => {
            "worklet";
            if (!previousPosition) return;
            let curr = +(Math.round(Math.abs(currentPosition)) / 434.0).toFixed(1);
            let prev = +(Math.round(Math.abs(previousPosition)) / 434.0).toFixed(1);
            if (curr !== prev && curr <= 1.00 && opacity.value != curr) {
                opacity.value = withTiming(1 - curr, { duration: 10 });
            }
        },
        [animatedPosition],
    );

    useEffect(() => {
        if (!userId) return;
        getPickupHistory(userId).then(setPickupHistory).catch(() => {});
        getDestinationHistory(userId).then(setDestinationHistory).catch(() => {});
        getFavourites(userId).then(setFavourites).catch(() => {});
    }, [userId]);

    const activeQuery = toggle ? destInput : pickupInput;

    useEffect(() => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        if (!activeQuery.trim()) {
            setResults([]);
            return;
        }
        debounceRef.current = setTimeout(async () => {
            setSearching(true);
            try {
                const proximity = userLocation[0] !== -1 ? userLocation : undefined;
                const res = await searchPlaces(activeQuery, proximity);
                setResults(res);
            } catch {
                setResults([]);
            } finally {
                setSearching(false);
            }
        }, 350);
        return () => {
            if (debounceRef.current) clearTimeout(debounceRef.current);
        };
    }, [activeQuery, userLocation]);

    function handleSelect(name: string, full_address: string, coords: Position) {
        if (toggle) {
            setDestInput(name);
            setDestCoords(coords);
        } else {
            setPickupInput(name);
            setPickupCoords(coords);
        }
        setResults([]);
        snapToIndex(0);
    }

    function isFavourite(entry: SearchHistoryEntry): boolean {
        return favourites.some(
            (f) =>
                f.name === entry.name &&
                f.full_address === entry.full_address &&
                Array.isArray(f.coords) &&
                Array.isArray(entry.coords) &&
                f.coords[0] === entry.coords[0] &&
                f.coords[1] === entry.coords[1]
        );
    }

    async function handleToggleFavourite(entry: SearchHistoryEntry) {
        if (!userId) return;
        try {
            const updated = await toggleFavourite(userId, entry);
            setFavourites(updated);
        } catch {
            // ignore for now
        }
    }

    const activeHistory = toggle ? destinationHistory : pickupHistory;
    const showHistory = !activeQuery.trim() && activeHistory.length > 0;

    return (
        <BottomSheetScrollView
            style={{
                flex: 1,
                marginBottom: 100,
                backgroundColor: Colors[colorScheme ?? "light"].bgDark,
                opacity: opacity,
            }}
            stickyHeaderIndices={[0]}
            keyboardShouldPersistTaps="handled"
        >
            <View>
                <View style={{
                    width: windowWidth,
                    paddingHorizontal: 20,
                    paddingVertical: 10,
                    backgroundColor: Colors[colorScheme ?? "light"].bgDark,
                }}>
                    <View
                        style={{
                            width: "100%",
                            alignItems: "center",
                            justifyContent: "center",
                        }}
                    >
                        <Text style={defaultStyles.title}>
                            Plan your{" "}
                            <Text style={{ color: Colors[colorScheme ?? "light"].primary }}>jurni</Text>
                        </Text>
                    </View>
                    <View style={{
                        width: "100%",
                        borderRadius: 15,
                        borderWidth: 2,
                        marginTop: 15,
                        paddingVertical: 10,
                        paddingHorizontal: 10,
                        borderColor: Colors[colorScheme ?? "light"].text,
                    }}>
                        <View style={{
                            height: 18,
                            alignItems: "center",
                            justifyContent: "center",
                            flexDirection: "row",
                            gap: 12,
                        }}>
                            <FontAwesomeIcon
                                icon={faLocationDot}
                                size={16}
                                color={Colors[colorScheme ?? "light"].text}
                            />
                            <View
                                style={{
                                    flex: 1,
                                    flexDirection: "row",
                                    alignItems: "center",
                                    position: "relative",
                                }}
                            >
                                <BottomSheetTextInput
                                    style={{
                                        flex: 1,
                                        height: "100%",
                                        fontSize: 16,
                                        color: Colors[colorScheme ?? "light"].text,
                                        fontFamily: 'Outfit_400Regular',
                                        paddingRight: 24,
                                    }}
                                    selectTextOnFocus
                                    placeholderTextColor={Colors[colorScheme ?? "light"].textMuted}
                                    placeholder='Pickup Location'
                                    value={pickupInput}
                                    onChangeText={(text) => setPickupInput(text)}
                                    onFocus={() => {
                                        setToggle(false);
                                        setIsPickupFocused(true);
                                    }}
                                    onBlur={() => setIsPickupFocused(false)}
                                    ref={pickupRef}
                                />
                                {isPickupFocused && pickupInput.trim().length > 0 && (
                                    <TouchableOpacity
                                        onPress={() => {
                                            setPickupInput("");
                                            setPickupCoords([-1, -1]);
                                            setResults([]);
                                        }}
                                        style={{
                                            position: "absolute",
                                            right: 0,
                                            paddingHorizontal: 6,
                                            paddingVertical: 2,
                                        }}
                                    >
                                        <FontAwesomeIcon
                                            icon={faXmark}
                                            size={12}
                                            color={Colors[colorScheme ?? "light"].textMuted}
                                        />
                                    </TouchableOpacity>
                                )}
                            </View>
                        </View>
                        <View style={{
                            marginLeft: (windowWidth - 40) * 0.05 + 10,
                            width: (windowWidth - 40) * 0.9 - 25,
                            borderWidth: 0.3,
                            marginTop: 6,
                            borderColor: Colors[colorScheme ?? "light"].text,
                        }} />
                        <View style={{
                            height: 18,
                            alignItems: "center",
                            justifyContent: "center",
                            marginTop: 8,
                            flexDirection: "row",
                            gap: 12,
                        }}>
                            <FontAwesomeIcon
                                icon={faMap}
                                size={16}
                                color={Colors[colorScheme ?? "light"].text}
                            />
                            <View
                                style={{
                                    flex: 1,
                                    flexDirection: "row",
                                    alignItems: "center",
                                    position: "relative",
                                }}
                            >
                                <BottomSheetTextInput
                                    style={{
                                        flex: 1,
                                        height: "100%",
                                        fontSize: 16,
                                        color: Colors[colorScheme ?? "light"].text,
                                        fontFamily: 'Outfit_400Regular',
                                        paddingRight: 24,
                                    }}
                                    placeholderTextColor={Colors[colorScheme ?? "light"].textMuted}
                                    placeholder='Where to?'
                                    value={destInput}
                                    onChangeText={(text) => setDestInput(text)}
                                    selectTextOnFocus
                                    onFocus={() => {
                                        setToggle(true);
                                        setIsDestFocused(true);
                                    }}
                                    onBlur={() => setIsDestFocused(false)}
                                    ref={destRef}
                                />
                                {isDestFocused && destInput.trim().length > 0 && (
                                    <TouchableOpacity
                                        onPress={() => {
                                            setDestInput("");
                                            setDestCoords([-1, -1]);
                                            setResults([]);
                                        }}
                                        style={{
                                            position: "absolute",
                                            right: 0,
                                            paddingHorizontal: 6,
                                            paddingVertical: 2,
                                        }}
                                    >
                                        <FontAwesomeIcon
                                            icon={faXmark}
                                            size={12}
                                            color={Colors[colorScheme ?? "light"].textMuted}
                                        />
                                    </TouchableOpacity>
                                )}
                            </View>
                        </View>
                    </View>
                </View>
            </View>

            {searching && (
                <View style={{ paddingVertical: 20, alignItems: "center" }}>
                    <ActivityIndicator size="small" color={Colors[colorScheme ?? "light"].text} />
                </View>
            )}

            {!searching && results.map((item) => {
                const entry: SearchHistoryEntry = {
                    name: item.name,
                    full_address: item.full_address,
                    coords: item.coords,
                };
                const fav = isFavourite(entry);
                return (
                    <View
                        key={item.id}
                        style={{
                            height: 56,
                            marginRight: 20,
                            marginBottom: 4,
                            flexDirection: "row",
                            alignItems: "center",
                        }}
                    >
                        <TouchableOpacity
                            onPress={() => handleSelect(item.name, item.full_address, item.coords)}
                            style={{ flex: 1, flexDirection: "row", alignItems: "center" }}
                        >
                            <View style={{ flex: 1, alignItems: "center" }}>
                                <FontAwesomeIcon
                                    icon={faMagnifyingGlass}
                                    size={15}
                                    color={Colors[colorScheme ?? "light"].text}
                                />
                            </View>
                            <View style={{
                                flex: 5,
                                borderBottomWidth: 0.6,
                                borderColor: Colors[colorScheme ?? "light"].bgLight,
                                justifyContent: "center",
                                paddingBottom: 4,
                            }}>
                                <Text style={{ ...defaultStyles.title, fontSize: 15 }} numberOfLines={1}>
                                    {item.name}
                                </Text>
                                <Text style={{ ...defaultStyles.subtitle, fontSize: 13 }} numberOfLines={1}>
                                    {item.full_address}
                                </Text>
                            </View>
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={() => handleToggleFavourite(entry)}
                            style={{ paddingHorizontal: 12 }}
                        >
                            <FontAwesomeIcon
                                icon={fav ? faStarSolid : faStarRegular}
                                size={15}
                                color={
                                    fav
                                        ? Colors[colorScheme ?? "light"].primary
                                        : Colors[colorScheme ?? "light"].textDull
                                }
                            />
                        </TouchableOpacity>
                    </View>
                );
            })}

            {!searching && showHistory && (
                <>
                    <View style={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 4 }}>
                        <Text style={{ ...defaultStyles.subtitle, fontSize: 12 }}>
                            {toggle ? "Recent destinations" : "Recent pickups"}
                        </Text>
                    </View>
                    {activeHistory.map((item, idx) => {
                        const fav = isFavourite(item);
                        return (
                            <View
                                key={`${item.name}-${idx}`}
                                style={{
                                    height: 56,
                                    marginRight: 20,
                                    marginBottom: 4,
                                    flexDirection: "row",
                                    alignItems: "center",
                                }}
                            >
                                <TouchableOpacity
                                    onPress={() => handleSelect(item.name, item.full_address, item.coords)}
                                    style={{ flex: 1, flexDirection: "row", alignItems: "center" }}
                                >
                                    <View style={{ flex: 1, alignItems: "center" }}>
                                        <FontAwesomeIcon
                                            icon={faClock}
                                            size={15}
                                            color={Colors[colorScheme ?? "light"].textDull}
                                        />
                                    </View>
                                    <View style={{
                                        flex: 5,
                                        borderBottomWidth: 0.6,
                                        borderColor: Colors[colorScheme ?? "light"].bgLight,
                                        justifyContent: "center",
                                        paddingBottom: 4,
                                    }}>
                                        <Text style={{ ...defaultStyles.title, fontSize: 15 }} numberOfLines={1}>
                                            {item.name}
                                        </Text>
                                        <Text style={{ ...defaultStyles.subtitle, fontSize: 13 }} numberOfLines={1}>
                                            {item.full_address}
                                        </Text>
                                    </View>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    onPress={() => handleToggleFavourite(item)}
                                    style={{ paddingHorizontal: 12 }}
                                >
                                    <FontAwesomeIcon
                                        icon={fav ? faStarSolid : faStarRegular}
                                        size={15}
                                        color={
                                            fav
                                                ? Colors[colorScheme ?? "light"].primary
                                                : Colors[colorScheme ?? "light"].textDull
                                        }
                                    />
                                </TouchableOpacity>
                            </View>
                        );
                    })}
                </>
            )}

            {!searching && !activeQuery.trim() && (
                <>
                    <View
                        style={{
                            marginHorizontal: 20,
                            height: 50,
                            marginTop: showHistory ? 4 : 0,
                            flexDirection: "row",
                            gap: 12,
                        }}
                    >
                        <TouchableOpacity
                            onPress={() => snapToIndex(0)}
                            style={{ flex: 1, alignItems: "center", flexDirection: "row", gap: 12 }}
                        >
                            <View style={{
                                height: 30,
                                width: 30,
                                borderRadius: 15,
                                backgroundColor: Colors[colorScheme ?? "light"].bg,
                                justifyContent: "center",
                                alignItems: "center",
                            }}>
                                <FontAwesomeIcon
                                    icon={faMapPin}
                                    size={15}
                                    color={Colors[colorScheme ?? "light"].text}
                                />
                            </View>
                            <Text style={{ ...defaultStyles.title, fontSize: 14 }}>
                                Set location on map
                            </Text>
                        </TouchableOpacity>
                    </View>

                    <View
                        style={{
                            marginHorizontal: 20,
                            height: 50,
                            marginTop: 8,
                            flexDirection: "row",
                            gap: 12,
                        }}
                    >
                        <TouchableOpacity
                            onPress={() => setFavouritesVisible(true)}
                            style={{ flex: 1, alignItems: "center", flexDirection: "row", gap: 12 }}
                        >
                            <View style={{
                                height: 30,
                                width: 30,
                                borderRadius: 15,
                                backgroundColor: Colors[colorScheme ?? "light"].bg,
                                justifyContent: "center",
                                alignItems: "center",
                            }}>
                                <FontAwesomeIcon
                                    icon={faStarSolid}
                                    size={15}
                                    color={Colors[colorScheme ?? "light"].primary}
                                />
                            </View>
                            <Text style={{ ...defaultStyles.title, fontSize: 14 }}>
                                Favourites
                            </Text>
                        </TouchableOpacity>
                    </View>
                </>
            )}

            <Modal
                visible={favouritesVisible}
                transparent
                animationType="slide"
                onRequestClose={() => setFavouritesVisible(false)}
            >
                <View
                    style={{
                        flex: 1,
                        backgroundColor: "rgba(0,0,0,0.5)",
                        justifyContent: "flex-end",
                    }}
                >
                    <View
                        style={{
                            backgroundColor: Colors[colorScheme ?? "light"].bgDark,
                            paddingHorizontal: 20,
                            paddingTop: 16,
                            paddingBottom: 32,
                            borderTopLeftRadius: 20,
                            borderTopRightRadius: 20,
                        }}
                    >
                        <View
                            style={{
                                flexDirection: "row",
                                alignItems: "center",
                                justifyContent: "space-between",
                                marginBottom: 12,
                            }}
                        >
                            <Text style={{ ...defaultStyles.title, fontSize: 16 }}>
                                Favourites
                            </Text>
                            <TouchableOpacity onPress={() => setFavouritesVisible(false)}>
                                <Text style={{ ...defaultStyles.subtitle, fontSize: 14 }}>
                                    Close
                                </Text>
                            </TouchableOpacity>
                        </View>

                        {favourites.length === 0 ? (
                            <Text style={{ ...defaultStyles.subtitle, fontSize: 13 }}>
                                You have no favourite locations yet.
                            </Text>
                        ) : (
                            favourites.map((item, idx) => (
                                <View
                                    key={`${item.name}-${idx}-fav-modal`}
                                    style={{
                                        height: 56,
                                        marginBottom: 4,
                                        flexDirection: "row",
                                        alignItems: "center",
                                    }}
                                >
                                    <TouchableOpacity
                                        onPress={() => {
                                            handleSelect(item.name, item.full_address, item.coords);
                                            setFavouritesVisible(false);
                                        }}
                                        style={{
                                            flex: 1,
                                            flexDirection: "row",
                                            alignItems: "center",
                                        }}
                                    >
                                        <View style={{ flex: 1, alignItems: "center" }}>
                                            <FontAwesomeIcon
                                                icon={faStarSolid}
                                                size={15}
                                                color={Colors[colorScheme ?? "light"].primary}
                                            />
                                        </View>
                                        <View
                                            style={{
                                                flex: 5,
                                                borderBottomWidth: 0.6,
                                                borderColor:
                                                    Colors[colorScheme ?? "light"].bgLight,
                                                justifyContent: "center",
                                                paddingBottom: 4,
                                            }}
                                        >
                                            <Text
                                                style={{
                                                    ...defaultStyles.title,
                                                    fontSize: 15,
                                                }}
                                                numberOfLines={1}
                                            >
                                                {item.name}
                                            </Text>
                                            <Text
                                                style={{
                                                    ...defaultStyles.subtitle,
                                                    fontSize: 13,
                                                }}
                                                numberOfLines={1}
                                            >
                                                {item.full_address}
                                            </Text>
                                        </View>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        onPress={() => handleToggleFavourite(item)}
                                        style={{ paddingHorizontal: 12 }}
                                    >
                                        <FontAwesomeIcon
                                            icon={faStarSolid}
                                            size={15}
                                            color={Colors[colorScheme ?? "light"].primary}
                                        />
                                    </TouchableOpacity>
                                </View>
                            ))
                        )}
                    </View>
                </View>
            </Modal>
        </BottomSheetScrollView>
    )
}

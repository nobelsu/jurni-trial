import { View, Text, useColorScheme, TouchableOpacity, } from 'react-native';
import { DrawerActions } from '@react-navigation/native';
import { useNavigation, useRouter, useFocusEffect } from 'expo-router';
import { BottomSheetFooter, } from '@gorhom/bottom-sheet';
import StyleDefault from '../../constants/DefaultStyles';
import { useRef, useMemo, useState, useEffect, useCallback } from 'react';
import * as Location from 'expo-location';
import { Colors } from '../../constants/Colors';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Dimensions } from 'react-native';
import { setAccessToken, MapView, Camera, Viewport, LocationPuck, OnMapSteadyEvent, CameraGestureObserver, MarkerView } from '@rnmapbox/maps';

import { pickupData, destinationData, rideTypeMetadata, } from '../../constants/MockData';

import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome'
import { faBars } from '@fortawesome/free-solid-svg-icons/faBars'
import { faLocationCrosshairs } from '@fortawesome/free-solid-svg-icons/faLocationCrosshairs'
import BottomSheet from '@gorhom/bottom-sheet';
import SetLocation from '../../components/SetLocation';
import SearchLocation from '../../components/SearchLocation';
import { MAPBOX_ACCESS_TOKEN, obtainWalkingDirections, Position, getPlaceLabelForCoords, obtainDirections, DrivingDirectionsResult } from '../../lib/mapbox';
import { reverseGeocodeWithCache } from '../../lib/searchCache';
import CrosshairOverlay from '../../components/Crosshair';
import Route from '../../components/Route';
import ConfirmRide from '../../components/ChooseRide';
import SelectRide from '../../components/SelectRide';
import RouteEndpointPin from '../../components/RouteEndpointPin';
import { faAngleRight } from '@fortawesome/free-solid-svg-icons/faAngleRight';
import ConfirmPickup from '../../components/ConfirmPickup';
import RouteWalking from '../../components/RouteWalking';
import Toast from '../../components/Toast';
import { getAuth } from '@react-native-firebase/auth';
import { calculateRideCostByType, RideTypeId } from '../../lib/cost';
import { getSilentOnlyDefault, getUserSettings, getUserVerificationStatus, updateUserSettings } from '../../lib/users';
import { faAngleLeft } from '@fortawesome/free-solid-svg-icons/faAngleLeft';
import { faApple } from '@fortawesome/free-brands-svg-icons/faApple';
import { faEllipsisVertical } from '@fortawesome/free-solid-svg-icons/faEllipsisVertical';

export default function MapScreen() {
    setAccessToken(MAPBOX_ACCESS_TOKEN);

    const colorScheme = useColorScheme();
    const defaultStyles = StyleDefault({ colorScheme });
    const router = useRouter();
    
    const bottomSheetRef = useRef<BottomSheet>(null);
    const bottomSheetRef1 = useRef<BottomSheet>(null);
    const bottomSheetRef2 = useRef<BottomSheet>(null);

    const snapPoints = useMemo(() =>  [260, "100%"], []);
    const snapPoints1 = useMemo(() => [320, 600], []);
    const snapPoints1List = [120, 390]
    const snapPoints2 = useMemo(() => [260], []);
    const snapPoints3 = useMemo(() => [500, "100%"], []);
    const navigation = useNavigation();

    const [location, setLocation] = useState<Location.LocationObject | null>(null);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const camera = useRef<Camera>(null);
    const [ne, setNe] = useState<Position>();
    const [sw, setSw] = useState<Position>();
    const [updated, setUpdated] = useState<boolean>(false);

    const [pickupInput, setPickupInput] = useState<string>("");
    const [destInput, setDestInput] = useState<string>("");
    const pickupRef = useRef<any>(null);
    const destRef = useRef<any>(null);
    const [data, setData] = useState<Array<any>>(destinationData);
    const [inputToggle, setInputToggle] = useState<boolean>(true); // true is for destination, false is for pickup
    const [moving, setMoving] = useState<boolean>(false);

    const [selected, setSelected] = useState<RideTypeId>("basic");
    const [distance, setDistance] = useState<number>(0);
    const [duration, setDuration] = useState<number>(0);

    const price = useMemo(() => calculateRideCostByType(selected, distance, duration), [selected, distance, duration]);

    const [phase, setPhase] = useState<number>(0);

    const windowWidth = Dimensions.get('window').width;
    const windowHeight = Dimensions.get('window').height;

    const [userLocation, setUserLocation] = useState<Position>([-1, -1]);

    const [coordinates, setCoordinates] = useState<Position[]>([]);
    const [walkingCoordinates, setWalkingCoordinates] = useState<Position[]>([]);
    
    const [showCrosshair, setShowCrosshair] = useState<Boolean>(true);

    const [pickupCoords, setPickupCoords] = useState<Position>([-1, -1]);
    const [destCoords, setDestCoords] = useState<Position>([-1, -1]);

    const [followUser, setFollowUser] = useState<boolean>(false)
    const [silentOnly, setSilentOnly] = useState<boolean>(false);
    const [femaleDriverPreferred, setFemaleDriverPreferred] = useState<boolean>(false);
    const [rideOptionsVisible, setRideOptionsVisible] = useState<boolean>(false);
    const [verified, setVerified] = useState<boolean>(false);
    const [styleLoaded, setStyleLoaded] = useState<boolean>(false);
    const [toastMessage, setToastMessage] = useState<string | null>(null);
    const [showToast, setShowToast] = useState<boolean>(false);

    const [processing, setProcessing] = useState<boolean>(false);

    const auth = getAuth();
    const user = auth.currentUser;

    useEffect(() => {
        setStyleLoaded(false);
    }, [colorScheme]);

    async function getCurrentLocation() {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
            setErrorMsg('Permission to access location was denied');
            return;
        }
        let currentLocation = await Location.getCurrentPositionAsync({});
        setLocation(currentLocation);

        const coords: Position = [
            currentLocation.coords.longitude,
            currentLocation.coords.latitude,
        ];

        setUserLocation(coords);
        setPickupCoords(coords);
        await obtainAddressFromSearchbox(coords, false);

        if (camera.current) {
            camera.current.setCamera({
                centerCoordinate: coords,
                zoomLevel: 16,
                padding: {
                    paddingBottom: 260,
                    paddingTop: 0,
                    paddingLeft: 0,
                    paddingRight: 0,
                },
            });
        }
    }

    async function obtainAddressFromSearchbox(coords: Position, isDestination: boolean) {
        setProcessing(true);
        try {
            const placeLabel = await getPlaceLabelForCoords(coords);
            const label =
                placeLabel?.name ||
                placeLabel?.full_address ||
                "";
            
            if (!label) {
                return;
            }

            if (isDestination) {
                setDestInput(label);
            } else {
                setPickupInput(label);
            }
        } catch (err) {
            console.log("Searchbox reverse lookup failed", err);
        }
        setProcessing(false);
    }

    async function reverseGeocodePickupForConfirm(coords: Position) {
        setProcessing(true);
        try {
            const label = await reverseGeocodeWithCache(coords);
            if (label?.name) {
                setPickupInput(label.name);
            }
        } catch (err) {
            console.log("Geocoding reverse lookup for confirm failed", err);
        }
        setProcessing(false);
    }

    const map = useRef<MapView>(null);
    const crosshair = useRef<View>(null);

    const handleNoDrivingRoute = useCallback(() => {
        setCoordinates([]);
        setWalkingCoordinates([]);
        setDistance(0);
        setDuration(0);
        setPhase(0);
        setToastMessage("No driving route is available between these locations. Try adjusting your pickup or destination.");
        setShowToast(true);
    }, []);

    const handleConfirmLocations = useCallback(async (override?: {
        pickupName?: string;
        pickupCoords?: Position;
        destName?: string;
        destCoords?: Position;
    }) => {
        const effectivePickupName = override?.pickupName ?? pickupInput;
        const effectiveDestName = override?.destName ?? destInput;
        const effectivePickupCoords = override?.pickupCoords ?? pickupCoords;
        const effectiveDestCoords = override?.destCoords ?? destCoords;

        if (!effectivePickupName || !effectiveDestName) {
            return;
        }
        try {
            const data: DrivingDirectionsResult = await obtainDirections(effectivePickupCoords, effectiveDestCoords);
            if (data.kind === "no_route") {
                handleNoDrivingRoute();
                return;
            }

            const line = require('@turf/turf').lineString(data.coordinates);
            const curved = require('@turf/turf').bezierSpline(line, { resolution: 5000 });

            setCoordinates(curved.geometry.coordinates as Position[]);

            const firstPoint = curved.geometry.coordinates[0] as Position;
            setPickupCoords(firstPoint);
            await obtainAddressFromSearchbox(firstPoint, false);

            const walking = await obtainWalkingDirections(firstPoint, userLocation);
            setWalkingCoordinates(walking);

            const bbox = require('../../lib/shared-util').computeBBox(data.coordinates);
            setSw([bbox.minLat, bbox.minLng]);
            setNe([bbox.maxLat, bbox.maxLng]);
            setUpdated(true);
            setDistance(data.distance);
            setDuration(data.duration);
            camera.current?.fitBounds(
                [bbox.maxLat, bbox.maxLng],
                [bbox.minLat, bbox.minLng],
                [70, 70, 120, 70],
                800
            );

            setPhase(1);
        } catch(err: any) {
            handleNoDrivingRoute();
        }
    }, [
        pickupInput,
        destInput,
        pickupCoords,
        destCoords,
        userLocation,
        handleNoDrivingRoute,
        obtainWalkingDirections,
    ]);

    const handlePartialConfirmToggle = useCallback(() => {
        if (pickupInput && !inputToggle) {
            setInputToggle(true);
        } else if (destInput && inputToggle) {
            setInputToggle(false);
        }
    }, [pickupInput, destInput, inputToggle]);

    useFocusEffect(
        useCallback(() => {
            getCurrentLocation();
            setUpdated(false);
            setPhase(0);
            setDestInput("");
            setDestCoords([-1, -1]);
            setInputToggle(true);
            setSelected("basic");
            setDistance(0);
            setDuration(0);
            setNe(undefined);
            setSw(undefined);
            setWalkingCoordinates([]);
            setFollowUser(false);
            setMoving(false);
            if (user?.uid) {
                getUserSettings(user.uid)
                    .then((settings) => {
                        setSilentOnly(!!settings.silent_only);
                        setFemaleDriverPreferred(!!settings.female_driver_preferred);
                    })
                    .catch(() => {
                        setSilentOnly(false);
                        setFemaleDriverPreferred(false);
                    });
                getUserVerificationStatus(user.uid)
                    .then((isVerified) => {
                        setVerified(isVerified);
                    })
                    .catch(() => {
                        setVerified(false);
                    });
            } else {
                setSilentOnly(false);
                setFemaleDriverPreferred(false);
                setVerified(false);
            }
            // bottomSheetRef.current?.snapToIndex(0);
            // bottomSheetRef1.current?.forceClose();
            // bottomSheetRef2.current?.forceClose();
        }, [])
    );

    useEffect(() => {
        if (user == null) {
            router.navigate("/login");
        }
        setFollowUser(false);
        getCurrentLocation();
        if (user?.uid) {
            getUserSettings(user.uid)
                .then((settings) => {
                    setSilentOnly(!!settings.silent_only);
                    setFemaleDriverPreferred(!!settings.female_driver_preferred);
                })
                .catch(() => {
                    setSilentOnly(false);
                    setFemaleDriverPreferred(false);
                });
            getUserVerificationStatus(user.uid)
                .then((isVerified) => {
                    setVerified(isVerified);
                })
                .catch(() => {
                    setVerified(false);
                });
        } else {
            setSilentOnly(false);
            setFemaleDriverPreferred(false);
            setVerified(false);
        }
    }, []);

    useEffect(() => {
        if (!pickupInput) {
            setData(pickupData)
        } else if (!destInput) {
            setData(destinationData)
        } else {
            setData(destinationData)
        }
    }, [destInput, pickupInput])

    useEffect(() => {
        if (phase == 0 || phase == 2) {
            setShowCrosshair(true);
        } else {
            setShowCrosshair(false);
        }
    }, [phase]);

    useEffect(() => {
        if (phase === 1) {
            bottomSheetRef.current?.close();
            bottomSheetRef2.current?.close();
            bottomSheetRef1.current?.snapToIndex(0);
        } else if (phase === 2) {
            bottomSheetRef.current?.close();
            bottomSheetRef1.current?.close();
            bottomSheetRef2.current?.snapToIndex(0);
        } else if (phase === 0) {
            bottomSheetRef1.current?.close();
            bottomSheetRef2.current?.close();
            bottomSheetRef.current?.snapToIndex(0);
        }
    }, [phase]);

    return (
        <GestureHandlerRootView style={{flex: 1,}}>
            <TouchableOpacity onPress={() => {navigation.dispatch(DrawerActions.toggleDrawer())}} style={{
                position: "absolute",
                height: 50,
                width: 50,
                borderRadius: 100,
                backgroundColor: Colors[colorScheme ?? "light"].bgDark,
                top: 60,
                left: 20,
                zIndex: 1000,
                justifyContent: "center",
                alignItems: "center",
            }}>
                <FontAwesomeIcon icon={faBars} size={20} color={Colors[colorScheme ?? "light"].text}/>
            </TouchableOpacity>
            {showCrosshair && <CrosshairOverlay ref={crosshair} moving={moving} />}
            <Toast
                message={toastMessage}
                visible={showToast}
                onDismiss={() => {
                    setShowToast(false);
                    setToastMessage(null);
                }}
            />
            {(!followUser && (phase == 0)) && 
                <TouchableOpacity style={{height: 36, width: 36, backgroundColor: Colors[colorScheme??"light"].bgDark, position: "absolute", right: 20, bottom: 280, zIndex: 1000, borderRadius: 18, justifyContent: "center", alignItems: "center"}} onPress={() => {
                    setFollowUser(true)
                }}>
                    <FontAwesomeIcon icon={faLocationCrosshairs} size={18} color={Colors[colorScheme ?? "light"].text}/>
                </TouchableOpacity>
            }
            {(location) ? 
            <MapView
                ref={map}
                styleURL={colorScheme == "light" ? 'mapbox://styles/mapbox/light-v11' : 'mapbox://styles/mapbox/dark-v11'}
                style={{
                    height: windowHeight,
                    width: windowWidth,
                }}
                onTouchMove={() => {
                    setMoving(true);

                    if (phase == 2) {
                        setWalkingCoordinates([]);
                    }
                }}
                scaleBarEnabled={false}
                logoEnabled={false}
                attributionEnabled={false}
                onDidFinishLoadingStyle={() => {
                    setStyleLoaded(true);
                }}
                projection='mercator'
            >
                {(phase == 1 && styleLoaded) && <Route key={colorScheme} coordinates={coordinates} />}
                {(phase == 1 && coordinates.length > 1 && styleLoaded) && (
                    <>
                        <MarkerView
                            key={`driving-route-start-${colorScheme}`}
                            id="driving-route-start"
                            coordinate={coordinates[0]}
                            allowOverlapWithPuck={true}
                            allowOverlap={true}
                        >
                            <RouteEndpointPin type="start" />
                        </MarkerView>
                        <MarkerView
                            id="driving-route-end"
                            coordinate={coordinates[coordinates.length - 1]}
                            allowOverlapWithPuck={true}
                            allowOverlap={true}
                        >
                            <RouteEndpointPin type="end" />
                        </MarkerView>
                    </>
                )}
                {(phase == 2 && styleLoaded) && <RouteWalking key={colorScheme} coordinates={walkingCoordinates} />}
                {(phase == 0) && <LocationPuck puckBearing='heading' puckBearingEnabled scale={0.7}/>}
                <Camera 
                    defaultSettings={{
                        centerCoordinate: [location?.coords.longitude, location?.coords.latitude] as Position, 
                        zoomLevel: 16,
                        // padding: {paddingBottom: 260, paddingTop: 0, paddingLeft: 0, paddingRight: 0,},
                        // animationDuration: 1,
                        // animationMode: "none", 
                    }}
                    centerCoordinate={[location?.coords.longitude, location?.coords.latitude] as Position}
                    // animationDuration={0}
                    zoomLevel={16} 
                    followZoomLevel={16} 
                    followUserLocation={followUser} 
                    
                    padding={{paddingBottom: 260, paddingTop: 0, paddingLeft: 0, paddingRight: 0,}}
                    animationMode={"none"}
                    animationDuration={1}
                    followPadding={{paddingBottom: 260, paddingTop: 0, paddingLeft: 0, paddingRight: 0,}}
                    ref={camera}
                />
                <CameraGestureObserver
                    quietPeriodMs={200}
                    maxIntervalMs={5000}
                    onMapSteady={({ nativeEvent } : { nativeEvent: OnMapSteadyEvent }) => {
                        const { reason, idleDurationMs, lastGestureType, timestamp } = nativeEvent;
                        if (lastGestureType == "pan") {
                            setMoving(false);
                            if (phase == 0) {
                                crosshair.current?.measure(async (x, y, width, height) => {
                                    const coords = await map.current?.getCoordinateFromView([x + width / 2.0, y + height / 2.0]);
                                    if (coords) {
                                        if (!inputToggle) {
                                            setPickupCoords(coords as Position);
                                            await obtainAddressFromSearchbox(coords as Position, false);
                                        } else {
                                            setDestCoords(coords as Position);
                                            await obtainAddressFromSearchbox(coords as Position, true);
                                        }
                                    }
                                });
                            } else if (phase == 2) {
                                crosshair.current?.measure(async (x, y, width, height) => {
                                    const coords = await map.current?.getCoordinateFromView([x + width / 2.0, y + height / 2.0]);
                                    if (coords) {
                                        setPickupCoords(coords as Position);
                                        await reverseGeocodePickupForConfirm(coords as Position);
                                        const walkingCoordinates = await obtainWalkingDirections(coords as Position, userLocation)
                                        // var line2 = turf.lineString(walkingCoordinates);
                                        // var curved2 = turf.bezierSpline(line2, {resolution: 10000});
                                        // setWalkingCoordinates(curved2.geometry.coordinates as Position[]);
                                        setWalkingCoordinates(walkingCoordinates)
                                    }
                                });
                            }
                        }
                    }}
                />
                <Viewport onStatusChanged={(e) => {
                    if (e.reason == "UserInteraction") {
                        setFollowUser(false)
                    }
                }}/>
            </MapView>
            :
            <View style={{flex: 1, backgroundColor: Colors[colorScheme ?? "light"].bgDark, zIndex: 1000,}}>
                <Text style={{color: Colors[colorScheme ?? "light"].text}}>
                    Loading
                </Text>
            </View>
            }
            <BottomSheet
                ref={bottomSheetRef}
                onChange={(idx) => {
                    if (idx == 1) {
                        if (inputToggle) destRef.current?.focus();
                        else pickupRef.current?.focus();
                    }
                }}
                backgroundStyle={{backgroundColor: Colors[colorScheme ?? "light"].bgDark}}
                handleIndicatorStyle={{backgroundColor: Colors[colorScheme ?? "light"].text}}
                keyboardBehavior="interactive"
                snapPoints={snapPoints}
                enableDynamicSizing={false}
                keyboardBlurBehavior='restore'
                topInset={150}
                containerStyle={{zIndex: 10000}}
            >
                <SetLocation 
                    setPhase={setPhase} 
                    nextRef={bottomSheetRef1} 
                    moving={moving} 
                    toggle={inputToggle} 
                    setToggle={setInputToggle} 
                    pickupInput={pickupInput} 
                    setPickupInput={setPickupInput} 
                    destInput={destInput} 
                    setDestInput={setDestInput} 
                    pickupCoords={pickupCoords} 
                    destCoords={destCoords} 
                    setCoordinates={setCoordinates} 
                    cameraRef={camera}
                    setNe={setNe}
                    setSw={setSw}
                    setPickupCoords={setPickupCoords}
                    setWalkingCoordinates={setWalkingCoordinates}
                    userLocation={userLocation}
                    setDistance={setDistance}
                    setDuration={setDuration}
                    setUpdated={setUpdated}
                    onNoDrivingRoute={handleNoDrivingRoute}
                    onConfirmLocations={handleConfirmLocations}
                    onPartialConfirmToggle={handlePartialConfirmToggle}
                />
                <SearchLocation
                    destRef={destRef}
                    pickupRef={pickupRef}
                    toggle={inputToggle}
                    setToggle={setInputToggle}
                    pickupInput={pickupInput}
                    setPickupInput={setPickupInput}
                    destInput={destInput}
                    setDestInput={setDestInput}
                    setPickupCoords={setPickupCoords}
                    setDestCoords={setDestCoords}
                    userLocation={userLocation}
                    userId={user?.uid}
                    onConfirmLocations={handleConfirmLocations}
                    onPartialConfirmToggle={handlePartialConfirmToggle}
                />
            </BottomSheet>
            <BottomSheet 
                ref={bottomSheetRef1} 
                index={-1}
                backgroundStyle={{backgroundColor: Colors[colorScheme ?? "light"].bgDark}}
                handleIndicatorStyle={{backgroundColor: Colors[colorScheme ?? "light"].text}}
                keyboardBehavior="interactive"
                snapPoints={snapPoints1}
                enableDynamicSizing={false}
                keyboardBlurBehavior='restore'
                topInset={150}
                containerStyle={{zIndex: 10000}}
                onChange={(position) => {
                    if (!ne || !sw) return
                    // camera.current?.fitBounds(ne, sw)
                    if ((position == 0 || position == 1) && updated) {
                        camera.current?.fitBounds(ne, sw, [70, 70, snapPoints1List[position], 70], 800)
                    }
                    // camera.current?.setCamera({padding: {paddingBottom: snapPoints1List[(position+1)%2], paddingLeft: 70, paddingRight: 70, paddingTop: 70,}})
                }}
                footerComponent={(props) => {
                    return (
                        <BottomSheetFooter {...props}>
                            <TouchableOpacity 
                                style={{width: "100%", height: 50, paddingHorizontal: 20, flexDirection: "row", marginBottom: 5}}>
                                <View style={{flex: 1, flexDirection: "row", alignItems: "center"}}>
                                    <FontAwesomeIcon
                                        icon={faApple}
                                        size={18}
                                        color={Colors[colorScheme ?? "light"].text}
                                        style={{ marginLeft: 4, marginRight: 8,}}
                                    />
                                    <Text style={{color: Colors[colorScheme ?? "light"].text, fontSize: 16, fontWeight: 500,}}>Apple Pay</Text>
                                </View>
                                <View style={{flex: 1, justifyContent: "center", alignItems: "flex-end"}}>
                                    <FontAwesomeIcon icon={faAngleRight} size={16} color={Colors[colorScheme ?? "light"].text}/>
                                </View>
                            </TouchableOpacity>
                            <View style={{height: 50, marginHorizontal: 20, flexDirection: "row", marginBottom: 24, gap: 8,}}>
                                <TouchableOpacity 
                                    onPress={() => {
                                        setUpdated(false);
                                        setPhase(0);
                                    }}
                                    style={{width: 50, height: 50, backgroundColor: Colors[colorScheme ?? "light"].text, borderRadius: 10, justifyContent: "center", alignItems: "center"}}>
                                    <FontAwesomeIcon icon={faAngleLeft} size={20} color={Colors[colorScheme ?? "light"].bg}/>
                                </TouchableOpacity>
                                <TouchableOpacity 
                                    onPress={async () => {
                                        await reverseGeocodePickupForConfirm(pickupCoords);
                                        setPhase(2);
                                    }}
                                style={{flex: 1, height: 50, backgroundColor: Colors[colorScheme ?? "light"].text, borderRadius: 10, justifyContent: "center", alignItems: "center"}}>
                                <Text style={{fontSize: 18, fontWeight: 500, color: Colors[colorScheme ?? "light"].bg}}>Choose {rideTypeMetadata[selected]?.name}</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    onPress={() => {
                                        setRideOptionsVisible(true);
                                    }}
                                    style={{width: 50, height: 50, backgroundColor: Colors[colorScheme ?? "light"].text, borderRadius: 10, justifyContent: "center", alignItems: "center"}}
                                >
                                    <FontAwesomeIcon icon={faEllipsisVertical} size={18} color={Colors[colorScheme ?? "light"].bg}/>
                                </TouchableOpacity>
                            </View>
                        </BottomSheetFooter>
                    )
                }}
            >
                <ConfirmRide
                    selectedId={selected}
                    nextRef={bottomSheetRef2}
                    setPhase={setPhase}
                    mapRef={map}
                    distance={distance}
                    duration={duration}
                    silentOnly={silentOnly}
                    pickupCoords={pickupCoords}
                    setPickupInput={setPickupInput}
                />
                <SelectRide
                    selectedId={selected}
                    setSelected={setSelected}
                    nextRef={bottomSheetRef2}
                    setPhase={setPhase}
                    mapRef={map}
                    distance={distance}
                    duration={duration}
                    silentOnly={silentOnly}
                    setSilentOnly={setSilentOnly}
                    pickupCoords={pickupCoords}
                    setPickupInput={setPickupInput}
                    femaleDriverPreferred={femaleDriverPreferred}
                    setFemaleDriverPreferred={setFemaleDriverPreferred}
                    optionsVisible={rideOptionsVisible}
                    setOptionsVisible={setRideOptionsVisible}
                />
            </BottomSheet>
            <BottomSheet 
                ref={bottomSheetRef2} 
                index={-1}
                backgroundStyle={{backgroundColor: Colors[colorScheme ?? "light"].bgDark}}
                enableHandlePanningGesture={false}
                keyboardBehavior="interactive"
                snapPoints={snapPoints2}
                enableDynamicSizing={false}
                keyboardBlurBehavior='restore'
                topInset={150}
                containerStyle={{zIndex: 10000}}
                onChange={(position) => {
                    if (position == 0) {
                        camera.current?.setCamera({
                            centerCoordinate: pickupCoords,
                            padding: {paddingBottom: 260, paddingLeft: 0, paddingRight: 0, paddingTop: 0},
                            zoomLevel: 18,
                        });
                    }
                }}
            >
                <ConfirmPickup 
                    pickupInput={pickupInput} 
                    setPickupInput={setPickupInput}
                    destInput={destInput}
                    moving={moving} 
                    setPhase={setPhase} 
                    prevRef={bottomSheetRef1}
                    riderId={user?.uid}
                    price={price}
                    typeId={selected}
                    pickupCoords={pickupCoords}
                    destCoords={destCoords}
                    silentOnly={silentOnly}
                    femaleDriverPreferred={femaleDriverPreferred}
                    verified={verified}
                    processing={processing}
                />
            </BottomSheet>
        </GestureHandlerRootView>
    )
}
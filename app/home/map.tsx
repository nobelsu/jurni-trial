import { View, Text, useColorScheme, TouchableOpacity, StyleSheet, Share, Linking, Dimensions } from 'react-native';
import { DrawerActions } from '@react-navigation/native';
import { useNavigation, useFocusEffect } from 'expo-router';
import { BottomSheetFooter, } from '@gorhom/bottom-sheet';
import StyleDefault from '../../constants/DefaultStyles';
import { useRef, useMemo, useState, useEffect, useCallback } from 'react';
import * as Location from 'expo-location';
import { Colors } from '../../constants/Colors';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { setAccessToken, MapView, Camera, Viewport, LocationPuck, OnMapSteadyEvent, CameraGestureObserver, MarkerView } from '@rnmapbox/maps';

import { pickupData, destinationData, rideTypeMetadata, } from '../../constants/MockData';

import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome'
import { faBars } from '@fortawesome/free-solid-svg-icons/faBars'
import { faLocationCrosshairs } from '@fortawesome/free-solid-svg-icons/faLocationCrosshairs'
import BottomSheet, { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import SetLocation from '../../components/SetLocation';
import SearchLocation from '../../components/SearchLocation';
import { MAPBOX_ACCESS_TOKEN, obtainWalkingDirections, Position, getPlaceLabelForCoords, obtainDirections, DrivingDirectionsResult } from '../../lib/mapbox';
import { reverseGeocodeWithCache } from '../../lib/searchCache';
import CrosshairOverlay from '../../components/Crosshair';
import Route from '../../components/Route';
import ConfirmRide from '../../components/ChooseRide';
import SelectRide from '../../components/SelectRide';
import RouteEndpointPin from '../../components/RouteEndpointPin';
import DriverMapMarker from '../../components/DriverMapMarker';
import { faAngleRight } from '@fortawesome/free-solid-svg-icons/faAngleRight';
import ConfirmPickup from '../../components/ConfirmPickup';
import RouteWalking from '../../components/RouteWalking';
import Toast from '../../components/Toast';
import { getAuth } from '@react-native-firebase/auth';
import { calculateRideCostByType, RideTypeId } from '../../lib/cost';
import { clearUserActiveRideId, getSilentOnlyDefault, getUserSettings, getUserVerificationStatus, setUserActiveRideId, updateUserSettings } from '../../lib/users';
import { restoreActiveRideSession } from '../../lib/activeRide';
import { faAngleLeft } from '@fortawesome/free-solid-svg-icons/faAngleLeft';
import { faApple } from '@fortawesome/free-brands-svg-icons/faApple';
import { faEllipsisVertical } from '@fortawesome/free-solid-svg-icons/faEllipsisVertical';
import FindingDriver from '../../components/FindingDriver';
import firestore from '@react-native-firebase/firestore';
import DriverOnWay from '../../components/DriverOnWay';
import TripComplete from '../../components/TripComplete';
import { subscribeDriverLocation, haversineMeters } from '../../lib/driverLocation';
import { computeBBox } from '../../lib/shared-util';
import { parseGeopointToPosition, parseRideSecret, RIDE_STATUS, type DriverRouteStatus } from '../../lib/rides';
import { cancelRideAsRider } from '../../lib/cancelRide';
import { subscribeDriverProfile, type DriverProfile } from '../../lib/driverProfile';

const DRIVER_SEARCH_TIMEOUT_MS = 90_000;

const CAMERA_PADDING = {
    paddingBottom: 260,
    paddingTop: 0,
    paddingLeft: 0,
    paddingRight: 0,
};

setAccessToken(MAPBOX_ACCESS_TOKEN);

const RIDE_TYPE_IDS: RideTypeId[] = ["basic", "plus", "exec", "xl", "access"];

function parseRideTypeId(raw: unknown): RideTypeId | undefined {
    return typeof raw === "string" && RIDE_TYPE_IDS.includes(raw as RideTypeId)
        ? (raw as RideTypeId)
        : undefined;
}

type AcceptedRideState = {
    rideId: string;
    driverId: string | null;
    pickupLabel: string | null;
    destinationLabel: string | null;
    acceptedAtLabel: string | null;
    pickupCoords: Position | null;
    destinationCoords: Position | null;
    secret: string | null;
    price: number | null;
    typeId: RideTypeId | undefined;
};

export default function MapScreen() {
    const colorScheme = useColorScheme();
    const theme: keyof typeof Colors = colorScheme === "dark" ? "dark" : "light";
    const defaultStyles = StyleDefault({ colorScheme });
    
    const bottomSheetRef = useRef<BottomSheet>(null);
    const bottomSheetRef1 = useRef<BottomSheet>(null);
    const bottomSheetRef2 = useRef<BottomSheet>(null);
    const bottomSheetRef3 = useRef<BottomSheet>(null);
    const bottomSheetRef4 = useRef<BottomSheet>(null);
    const bottomSheetRef5 = useRef<BottomSheet>(null);

    const snapPoints = useMemo(() =>  [260, "100%"], []);
    const snapPoints1 = useMemo(() => [320, 600], []);
    const snapPoints1List = [120, 390]
    const snapPoints2 = useMemo(() => [260], []);
    const navigation = useNavigation();
    const insets = useSafeAreaInsets();

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
    const [pendingRideId, setPendingRideId] = useState<string | null>(null);
    const [acceptedRide, setAcceptedRide] = useState<AcceptedRideState | null>(null);
    const [tripStarted, setTripStarted] = useState<boolean>(false);
    const [tripEnded, setTripEnded] = useState<boolean>(false);
    const [cancellingRideRequest, setCancellingRideRequest] = useState<boolean>(false);
    const [cancellingActiveRide, setCancellingActiveRide] = useState<boolean>(false);
    const [searchTimedOut, setSearchTimedOut] = useState<boolean>(false);
    const [driverProfile, setDriverProfile] = useState<DriverProfile | null>(null);
    const hadDriverAssignedRef = useRef<boolean>(false);

    const snapPoints3 = useMemo(
        () => [searchTimedOut ? 260 : 360],
        [searchTimedOut]
    );
    const snapPoints4 = useMemo(
        () => (tripStarted ? ["42%"] : ["58%"]),
        [tripStarted]
    );
    const snapPoints5 = useMemo(() => [520], []);

    const phase4CameraBottomPadding = useMemo(() => {
        const { height } = Dimensions.get("window");
        const sheetHeight = height * (tripStarted ? 0.42 : 0.58);
        // ~42% of sheet height — tighter fit above the bottom sheet.
        return Math.round(sheetHeight * 0.42);
    }, [tripStarted]);

    const [driverLocation, setDriverLocation] = useState<Position | null>(null);
    const [driverLocationError, setDriverLocationError] = useState<string | null>(null);
    const [driverRouteCoords, setDriverRouteCoords] = useState<Position[]>([]);
    const [driverRouteDistanceKm, setDriverRouteDistanceKm] = useState<number>(0);
    const [driverRouteDurationMin, setDriverRouteDurationMin] = useState<number>(0);
    const [driverRouteFetching, setDriverRouteFetching] = useState(false);
    const [tripRouteCoords, setTripRouteCoords] = useState<Position[]>([]);
    const lastRouteFetchPosRef = useRef<Position | null>(null);
    const lastRouteTargetRef = useRef<Position | null>(null);
    const driverRouteBboxRef = useRef<{ ne: Position; sw: Position } | null>(null);
    const tripRouteBboxRef = useRef<{ ne: Position; sw: Position } | null>(null);
    const prevTripStartedRef = useRef<boolean>(false);

    const phase4PickupTarget = useMemo<Position | null>(() => {
        const localValid =
            Array.isArray(pickupCoords) &&
            pickupCoords.length >= 2 &&
            pickupCoords[0] !== -1 &&
            pickupCoords[1] !== -1;
        if (localValid) return pickupCoords;
        if (acceptedRide?.pickupCoords) return acceptedRide.pickupCoords;
        return null;
    }, [pickupCoords, acceptedRide?.pickupCoords]);

    const phase4DestinationTarget = useMemo<Position | null>(() => {
        const localValid =
            Array.isArray(destCoords) &&
            destCoords.length >= 2 &&
            destCoords[0] !== -1 &&
            destCoords[1] !== -1;
        if (localValid) return destCoords;
        if (acceptedRide?.destinationCoords) return acceptedRide.destinationCoords;
        return null;
    }, [destCoords, acceptedRide?.destinationCoords]);

    const phase4RouteTarget = useMemo<Position | null>(() => {
        if (tripEnded) return null;
        if (tripStarted) return phase4DestinationTarget;
        return phase4PickupTarget;
    }, [tripStarted, tripEnded, phase4DestinationTarget, phase4PickupTarget]);

    const phase4EndMarkerTarget = useMemo<Position | null>(() => {
        if (tripStarted) return phase4DestinationTarget;
        return phase4PickupTarget;
    }, [tripStarted, phase4DestinationTarget, phase4PickupTarget]);

    const driverRouteStatus = useMemo((): DriverRouteStatus => {
        if (phase !== 4 || tripEnded) {
            return 'waiting_location';
        }
        if (driverLocationError) {
            return 'error';
        }
        if (!driverLocation) {
            return 'waiting_location';
        }
        if (
            driverRouteDurationMin > 0 &&
            Number.isFinite(driverRouteDurationMin) &&
            driverRouteCoords.length > 1
        ) {
            return 'ready';
        }
        if (driverRouteFetching) {
            return 'loading';
        }
        if (!phase4RouteTarget) {
            return 'loading';
        }
        return 'loading';
    }, [
        phase,
        tripEnded,
        driverLocationError,
        driverLocation,
        driverRouteDurationMin,
        driverRouteCoords.length,
        driverRouteFetching,
        phase4RouteTarget,
    ]);

    const user = getAuth().currentUser;
    const hasSetInitialCamera = useRef(false);
    const hasFetchedLocation = useRef(false);
    const didRestoreActiveRide = useRef(false);
    const mapSteadyHandlerRef = useRef(false);

    useEffect(() => {
        setStyleLoaded(false);
    }, [colorScheme]);

    const mapStyleUrl = useMemo(
        () =>
            colorScheme === "light"
                ? "mapbox://styles/mapbox/light-v11"
                : "mapbox://styles/mapbox/dark-v11",
        [colorScheme]
    );

    const cameraDefaultSettings = useMemo(
        () => ({
            zoomLevel: 16,
            padding: CAMERA_PADDING,
        }),
        []
    );

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

        if (camera.current && !hasSetInitialCamera.current) {
            hasSetInitialCamera.current = true;
            camera.current.setCamera({
                centerCoordinate: coords,
                zoomLevel: 16,
                padding: {
                    paddingBottom: 260,
                    paddingTop: 0,
                    paddingLeft: 0,
                    paddingRight: 0,
                },
                animationDuration: 0,
            });
        }
    }

    const resetRideRequestState = useCallback(() => {
        const uid = getAuth().currentUser?.uid;
        if (uid) {
            void clearUserActiveRideId(uid);
        }
        setUpdated(false);
        setPhase(0);
        setPickupInput("");
        setPickupCoords([-1, -1]);
        setDestInput("");
        setDestCoords([-1, -1]);
        setInputToggle(true);
        setSelected("basic");
        setDistance(0);
        setDuration(0);
        setCoordinates([]);
        setWalkingCoordinates([]);
        setNe(undefined);
        setSw(undefined);
        setFollowUser(false);
        setMoving(false);
        setRideOptionsVisible(false);
        setPendingRideId(null);
        setAcceptedRide(null);
        setTripStarted(false);
        setTripEnded(false);
        setDriverLocation(null);
        setDriverLocationError(null);
        setDriverRouteCoords([]);
        setDriverRouteDistanceKm(0);
        setDriverRouteDurationMin(0);
        setDriverRouteFetching(false);
        setTripRouteCoords([]);
        lastRouteFetchPosRef.current = null;
        lastRouteTargetRef.current = null;
        driverRouteBboxRef.current = null;
        tripRouteBboxRef.current = null;
        prevTripStartedRef.current = false;
        setSearchTimedOut(false);
        setDriverProfile(null);
        setCancellingActiveRide(false);
        hadDriverAssignedRef.current = false;
    }, []);

    const handleTripCompleteDone = useCallback(() => {
        resetRideRequestState();
        void getCurrentLocation();
    }, [resetRideRequestState]);

    const toAcceptedAtLabel = useCallback((rawAcceptedAt: any): string | null => {
        if (!rawAcceptedAt) {
            return null;
        }
        const acceptedDate =
            typeof rawAcceptedAt?.toDate === "function"
                ? rawAcceptedAt.toDate()
                : rawAcceptedAt instanceof Date
                    ? rawAcceptedAt
                    : null;
        if (!acceptedDate) {
            return null;
        }
        return acceptedDate.toLocaleTimeString([], {
            hour: "numeric",
            minute: "2-digit",
        });
    }, []);

    const handleCancelRideRequest = useCallback(async () => {
        if (cancellingRideRequest) {
            return;
        }
        setCancellingRideRequest(true);
        const rideIdToDelete = pendingRideId;
        resetRideRequestState();
        try {
            if (rideIdToDelete) {
                await firestore().collection("rides").doc(rideIdToDelete).delete();
            }
            await getCurrentLocation();
        } catch (error) {
            console.log("Failed to cancel pending ride request", error);
            setToastMessage("Couldn't fully cancel your ride request. Please try again.");
            setShowToast(true);
        } finally {
            setCancellingRideRequest(false);
        }
    }, [cancellingRideRequest, pendingRideId, resetRideRequestState]);

    const handleTryAgainAfterTimeout = useCallback(async () => {
        const rideIdToDelete = pendingRideId;
        const uid = getAuth().currentUser?.uid;
        if (uid) {
            void clearUserActiveRideId(uid);
        }
        setPendingRideId(null);
        setAcceptedRide(null);
        setSearchTimedOut(false);
        setTripStarted(false);
        setTripEnded(false);
        setDriverLocation(null);
        setDriverLocationError(null);
        setDriverRouteCoords([]);
        setDriverRouteDistanceKm(0);
        setDriverRouteDurationMin(0);
        setDriverRouteFetching(false);
        lastRouteFetchPosRef.current = null;
        lastRouteTargetRef.current = null;
        setDriverProfile(null);
        hadDriverAssignedRef.current = false;
        try {
            if (rideIdToDelete) {
                await firestore().collection("rides").doc(rideIdToDelete).delete();
            }
        } catch (error) {
            console.log("Failed to delete timed-out ride", error);
        }
        setPhase(1);
        bottomSheetRef1.current?.snapToIndex(0);
    }, [pendingRideId]);

    const handleCancelActiveRide = useCallback(async () => {
        if (cancellingActiveRide || !pendingRideId) {
            return;
        }
        setCancellingActiveRide(true);
        try {
            await cancelRideAsRider(pendingRideId);
        } catch (error) {
            console.log("Failed to cancel active ride", error);
            setToastMessage("Couldn't cancel your ride. Please try again.");
            setShowToast(true);
        } finally {
            setCancellingActiveRide(false);
        }
    }, [cancellingActiveRide, pendingRideId]);

    const handleSharePin = useCallback(async () => {
        const secret = acceptedRide?.secret;
        if (!secret) {
            return;
        }
        try {
            await Share.share({
                message: `Your Jurni trip PIN is ${secret}. Give this to your driver when they arrive.`,
            });
        } catch (error) {
            console.log("Failed to share trip PIN", error);
        }
    }, [acceptedRide?.secret]);

    const handleCallDriver = useCallback(() => {
        const phone = driverProfile?.phone;
        if (!phone) {
            setToastMessage("Calling isn't available yet.");
            setShowToast(true);
            return;
        }
        void Linking.openURL(`tel:${phone}`);
    }, [driverProfile?.phone]);

    const handleMessageDriver = useCallback(() => {
        setToastMessage("Messaging isn't available yet.");
        setShowToast(true);
    }, []);

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

    const loadUserPreferences = useCallback((uid: string) => {
        getUserSettings(uid)
            .then((settings) => {
                setSilentOnly(!!settings.silent_only);
                setFemaleDriverPreferred(!!settings.female_driver_preferred);
            })
            .catch(() => {
                setSilentOnly(false);
                setFemaleDriverPreferred(false);
            });
        getUserVerificationStatus(uid)
            .then((isVerified) => {
                setVerified(isVerified);
            })
            .catch(() => {
                setVerified(false);
            });
    }, []);

    useFocusEffect(
        useCallback(() => {
            const uid = getAuth().currentUser?.uid;
            if (uid) {
                loadUserPreferences(uid);
            } else {
                setSilentOnly(false);
                setFemaleDriverPreferred(false);
                setVerified(false);
            }
        }, [loadUserPreferences])
    );

    useEffect(() => {
        setFollowUser(false);
        if (!hasFetchedLocation.current) {
            hasFetchedLocation.current = true;
            void getCurrentLocation();
        }
        const uid = getAuth().currentUser?.uid;
        if (uid) {
            loadUserPreferences(uid);
        }
    }, []);

    useEffect(() => {
        if (didRestoreActiveRide.current) {
            return;
        }
        const uid = getAuth().currentUser?.uid;
        if (!uid) {
            return;
        }
        didRestoreActiveRide.current = true;

        void (async () => {
            try {
                const result = await restoreActiveRideSession(uid);
                if (!result.restored) {
                    return;
                }

                setPendingRideId(result.rideId);
                if (result.pickupLabel) {
                    setPickupInput(result.pickupLabel);
                }
                if (result.destinationLabel) {
                    setDestInput(result.destinationLabel);
                }
                if (result.pickupCoords) {
                    setPickupCoords(result.pickupCoords);
                }
                if (result.destinationCoords) {
                    setDestCoords(result.destinationCoords);
                }
                setTripStarted(result.tripStarted);
                setTripEnded(result.tripEnded);
                if (result.typeId) {
                    setSelected(result.typeId);
                }
                if (result.driverId) {
                    hadDriverAssignedRef.current = true;
                }

                if (result.phase >= 4) {
                    setAcceptedRide({
                        rideId: result.rideId,
                        driverId: result.driverId,
                        pickupLabel: result.pickupLabel,
                        destinationLabel: result.destinationLabel,
                        acceptedAtLabel: result.acceptedAtLabel,
                        pickupCoords: result.pickupCoords,
                        destinationCoords: result.destinationCoords,
                        secret: result.secret,
                        price: result.price,
                        typeId: result.typeId,
                    });
                }

                setPhase(result.phase);
            } catch (error) {
                console.log("Failed to restore active ride session", error);
            }
        })();
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
        if (!pendingRideId || phase < 3) {
            return;
        }
        const unsubscribe = firestore()
            .collection("rides")
            .doc(pendingRideId)
            .onSnapshot(
                (snapshot) => {
                    if (!snapshot.exists()) {
                        setToastMessage("Ride was removed.");
                        setShowToast(true);
                        resetRideRequestState();
                        return;
                    }
                    const ride = snapshot.data();
                    if (!ride) {
                        return;
                    }

                    const status = ride.status;
                    const driverId =
                        typeof ride.driver_id === "string" && ride.driver_id.length > 0
                            ? ride.driver_id
                            : null;

                    if (status === RIDE_STATUS.CANCELLED) {
                        const cancelledBy = ride.cancelled_by;
                        setToastMessage(
                            cancelledBy === "rider"
                                ? "Ride cancelled."
                                : "Ride was cancelled."
                        );
                        setShowToast(true);
                        resetRideRequestState();
                        setPhase(1);
                        bottomSheetRef1.current?.snapToIndex(0);
                        return;
                    }

                    const hasEnded =
                        ride.ended_at != null || status === RIDE_STATUS.COMPLETED;
                    const isAccepted = status === RIDE_STATUS.ACCEPTED;
                    const isInProgress =
                        status === RIDE_STATUS.IN_PROGRESS ||
                        (ride.started_at != null && !hasEnded);
                    if (
                        hadDriverAssignedRef.current &&
                        !driverId &&
                        !hasEnded &&
                        status !== RIDE_STATUS.CANCELLED
                    ) {
                        setToastMessage("Your driver had to cancel.");
                        setShowToast(true);
                        resetRideRequestState();
                        setPhase(1);
                        bottomSheetRef1.current?.snapToIndex(0);
                        return;
                    }

                    if (!isAccepted && !isInProgress && !hasEnded) {
                        return;
                    }

                    if (driverId) {
                        if (!hadDriverAssignedRef.current) {
                            const uid = getAuth().currentUser?.uid;
                            if (uid) {
                                void setUserActiveRideId(uid, snapshot.id);
                            }
                        }
                        hadDriverAssignedRef.current = true;
                    }

                    setSearchTimedOut(false);

                    const pickupCoordsFromRide = parseGeopointToPosition(ride.pickup_geopoint);
                    const destinationCoordsFromRide = parseGeopointToPosition(
                        ride.destination_geopoint
                    );
                    const ridePrice =
                        typeof ride.price === "number" && Number.isFinite(ride.price)
                            ? ride.price
                            : null;
                    const nextAcceptedRide: AcceptedRideState = {
                        rideId: snapshot.id,
                        driverId,
                        pickupLabel: typeof ride.pickup === "string" && ride.pickup.length > 0 ? ride.pickup : null,
                        destinationLabel:
                            typeof ride.destination === "string" && ride.destination.length > 0
                                ? ride.destination
                                : null,
                        acceptedAtLabel: toAcceptedAtLabel(ride.accepted_at),
                        pickupCoords: pickupCoordsFromRide,
                        destinationCoords: destinationCoordsFromRide,
                        secret: parseRideSecret(ride.secret),
                        price: ridePrice,
                        typeId: parseRideTypeId(ride.type_id),
                    };
                    setAcceptedRide((prev) => {
                        if (
                            prev &&
                            prev.rideId === nextAcceptedRide.rideId &&
                            prev.driverId === nextAcceptedRide.driverId &&
                            prev.pickupLabel === nextAcceptedRide.pickupLabel &&
                            prev.destinationLabel === nextAcceptedRide.destinationLabel &&
                            prev.acceptedAtLabel === nextAcceptedRide.acceptedAtLabel &&
                            prev.secret === nextAcceptedRide.secret &&
                            prev.price === nextAcceptedRide.price &&
                            prev.typeId === nextAcceptedRide.typeId &&
                            prev.pickupCoords?.[0] === nextAcceptedRide.pickupCoords?.[0] &&
                            prev.pickupCoords?.[1] === nextAcceptedRide.pickupCoords?.[1] &&
                            prev.destinationCoords?.[0] === nextAcceptedRide.destinationCoords?.[0] &&
                            prev.destinationCoords?.[1] === nextAcceptedRide.destinationCoords?.[1]
                        ) {
                            return prev;
                        }
                        return nextAcceptedRide;
                    });
                    if (hasEnded) {
                        setTripEnded(true);
                        setTripStarted(true);
                        setPhase(5);
                    } else {
                        setTripEnded(false);
                        setTripStarted(isInProgress);
                        setPhase(4);
                    }
                },
                (error) => {
                    console.log("Failed to listen for ride acceptance", error);
                }
            );

        return () => unsubscribe();
    }, [pendingRideId, phase, toAcceptedAtLabel, resetRideRequestState]);

    useEffect(() => {
        if (phase !== 3 || !pendingRideId) {
            return;
        }
        setSearchTimedOut(false);
        const timer = setTimeout(() => {
            setSearchTimedOut(true);
        }, DRIVER_SEARCH_TIMEOUT_MS);
        return () => clearTimeout(timer);
    }, [phase, pendingRideId]);

    useEffect(() => {
        if (phase === 3) {
            bottomSheetRef3.current?.snapToIndex(0);
        }
    }, [phase, searchTimedOut]);

    useEffect(() => {
        const driverId = acceptedRide?.driverId;
        if (!driverId || phase < 4) {
            setDriverProfile(null);
            return;
        }
        return subscribeDriverProfile(driverId, (profile) => {
            setDriverProfile((prev) => {
                if (
                    prev &&
                    prev.name === profile.name &&
                    prev.rating === profile.rating &&
                    prev.vehicleLabel === profile.vehicleLabel &&
                    prev.phone === profile.phone
                ) {
                    return prev;
                }
                return profile;
            });
        });
    }, [acceptedRide?.driverId, phase]);

    const refreshDriverRoute = useCallback(
        async (driverPos: Position, target: Position | null) => {
            if (!target) {
                return;
            }

            const prevTarget = lastRouteTargetRef.current;
            const targetChanged =
                !prevTarget ||
                prevTarget[0] !== target[0] ||
                prevTarget[1] !== target[1];
            if (targetChanged) {
                lastRouteFetchPosRef.current = null;
                lastRouteTargetRef.current = target;
            }

            const last = lastRouteFetchPosRef.current;
            if (last && haversineMeters(last, driverPos) <= 100) {
                return;
            }

            setDriverRouteFetching(true);
            try {
                const res = await obtainDirections(driverPos, target);
                if (res.kind !== "ok") {
                    setDriverRouteCoords([]);
                    setDriverRouteDistanceKm(0);
                    setDriverRouteDurationMin(0);
                    return;
                }
                lastRouteFetchPosRef.current = driverPos;
                setDriverRouteCoords(res.coordinates as Position[]);
                setDriverRouteDistanceKm(res.distance);
                setDriverRouteDurationMin(res.duration);
                const latLngCoords: [number, number][] = (res.coordinates as Position[]).map(
                    ([lng, lat]) => [lat, lng]
                );
                const bbox = computeBBox(latLngCoords);
                const ne: Position = [bbox.maxLng, bbox.maxLat];
                const sw: Position = [bbox.minLng, bbox.minLat];
                driverRouteBboxRef.current = { ne, sw };
                camera.current?.fitBounds(
                    ne,
                    sw,
                    [70, 70, phase4CameraBottomPadding, 70],
                    800
                );
            } catch (err) {
                console.log("Failed to fetch driver route directions", err);
            } finally {
                setDriverRouteFetching(false);
            }
        },
        [phase4CameraBottomPadding]
    );

    useEffect(() => {
        if (tripStarted && !prevTripStartedRef.current) {
            setDriverRouteCoords([]);
            setDriverRouteDistanceKm(0);
            setDriverRouteDurationMin(0);
            lastRouteFetchPosRef.current = null;
            lastRouteTargetRef.current = null;
            if (driverLocation && phase4RouteTarget) {
                void refreshDriverRoute(driverLocation, phase4RouteTarget);
            }
        }
        prevTripStartedRef.current = tripStarted;
    }, [tripStarted, driverLocation, phase4RouteTarget, refreshDriverRoute]);

    useEffect(() => {
        if (phase !== 4 || tripEnded || !acceptedRide?.driverId) {
            return;
        }
        setDriverLocationError(null);
        const unsubscribe = subscribeDriverLocation(
            acceptedRide.driverId,
            ({ lng, lat }) => {
                const driverPos: Position = [lng, lat];
                setDriverLocationError(null);
                setDriverLocation((prev) => {
                    if (prev && haversineMeters(prev, driverPos) < 5) {
                        return prev;
                    }
                    return driverPos;
                });
                void refreshDriverRoute(driverPos, phase4RouteTarget);
            },
            (error) => {
                setDriverLocationError(error.message);
                setToastMessage("Can't load driver location. Please check your connection.");
                setShowToast(true);
            }
        );
        return () => unsubscribe();
    }, [phase, tripEnded, acceptedRide?.driverId, phase4RouteTarget, refreshDriverRoute]);

    useEffect(() => {
        if (phase !== 4 || tripEnded || !driverLocation || !phase4RouteTarget) {
            return;
        }
        if (driverRouteCoords.length >= 2 || driverRouteFetching) {
            return;
        }
        lastRouteFetchPosRef.current = null;
        void refreshDriverRoute(driverLocation, phase4RouteTarget);
    }, [
        phase,
        tripEnded,
        driverLocation,
        phase4RouteTarget,
        driverRouteCoords.length,
        driverRouteFetching,
        refreshDriverRoute,
    ]);

    useEffect(() => {
        if (phase !== 5) {
            return;
        }
        const pickup = phase4PickupTarget;
        const destination = phase4DestinationTarget;
        if (!pickup || !destination) {
            if (coordinates.length > 1) {
                setTripRouteCoords(coordinates);
                const latLngCoords: [number, number][] = coordinates.map(([lng, lat]) => [lat, lng]);
                const bbox = computeBBox(latLngCoords);
                const ne: Position = [bbox.maxLng, bbox.maxLat];
                const sw: Position = [bbox.minLng, bbox.minLat];
                tripRouteBboxRef.current = { ne, sw };
                camera.current?.fitBounds(ne, sw, [70, 70, 480, 70], 800);
            }
            return;
        }
        let cancelled = false;
        void obtainDirections(pickup, destination).then((res) => {
            if (cancelled) {
                return;
            }
            if (res.kind !== "ok") {
                if (coordinates.length > 1) {
                    setTripRouteCoords(coordinates);
                }
                return;
            }
            setTripRouteCoords(res.coordinates as Position[]);
            const latLngCoords: [number, number][] = (res.coordinates as Position[]).map(
                ([lng, lat]) => [lat, lng]
            );
            const bbox = computeBBox(latLngCoords);
            const ne: Position = [bbox.maxLng, bbox.maxLat];
            const sw: Position = [bbox.minLng, bbox.minLat];
            tripRouteBboxRef.current = { ne, sw };
            camera.current?.fitBounds(ne, sw, [70, 70, 480, 70], 800);
        });
        return () => {
            cancelled = true;
        };
    }, [phase, phase4PickupTarget, phase4DestinationTarget, coordinates]);

    useEffect(() => {
        if (phase === 1) {
            bottomSheetRef1.current?.snapToIndex(0);
            bottomSheetRef.current?.close();
            bottomSheetRef2.current?.close();
            bottomSheetRef3.current?.close();
            bottomSheetRef4.current?.close();
            bottomSheetRef5.current?.close();
        } else if (phase === 2) {
            bottomSheetRef2.current?.snapToIndex(0);
            bottomSheetRef.current?.close();
            bottomSheetRef1.current?.close();
            bottomSheetRef3.current?.close();
            bottomSheetRef4.current?.close();
            bottomSheetRef5.current?.close();
        } else if (phase === 3) {
            bottomSheetRef3.current?.snapToIndex(0);
            bottomSheetRef.current?.close();
            bottomSheetRef1.current?.close();
            bottomSheetRef2.current?.close();
            bottomSheetRef4.current?.close();
            bottomSheetRef5.current?.close();
        } else if (phase === 4) {
            bottomSheetRef4.current?.snapToIndex(0);
            bottomSheetRef.current?.close();
            bottomSheetRef1.current?.close();
            bottomSheetRef2.current?.close();
            bottomSheetRef3.current?.close();
            bottomSheetRef5.current?.close();
            const bbox = driverRouteBboxRef.current;
            if (bbox) {
                camera.current?.fitBounds(
                    bbox.ne,
                    bbox.sw,
                    [70, 70, phase4CameraBottomPadding, 70],
                    800
                );
            }
        } else if (phase === 5) {
            bottomSheetRef5.current?.snapToIndex(0);
            bottomSheetRef.current?.close();
            bottomSheetRef1.current?.close();
            bottomSheetRef2.current?.close();
            bottomSheetRef3.current?.close();
            bottomSheetRef4.current?.close();
            const bbox = tripRouteBboxRef.current;
            if (bbox) {
                camera.current?.fitBounds(bbox.ne, bbox.sw, [70, 70, 480, 70], 800);
            }
        } else if (phase === 0) {
            bottomSheetRef.current?.snapToIndex(0);
            bottomSheetRef1.current?.close();
            bottomSheetRef2.current?.close();
            bottomSheetRef3.current?.close();
            bottomSheetRef4.current?.close();
            bottomSheetRef5.current?.close();
        }
    }, [phase, phase4CameraBottomPadding]);

    useEffect(() => {
        if (phase !== 4 || tripEnded) {
            return;
        }
        const bbox = driverRouteBboxRef.current;
        if (!bbox) {
            return;
        }
        camera.current?.fitBounds(
            bbox.ne,
            bbox.sw,
            [70, 70, phase4CameraBottomPadding, 70],
            800
        );
    }, [phase, tripEnded, tripStarted, phase4CameraBottomPadding]);

    return (
        <GestureHandlerRootView style={styles.root}>
            <TouchableOpacity onPress={() => {navigation.dispatch(DrawerActions.toggleDrawer())}} style={{
                position: "absolute",
                height: 50,
                width: 50,
                borderRadius: 100,
                backgroundColor: Colors[theme].bgDark,
                top: 60,
                left: 20,
                zIndex: 1000,
                justifyContent: "center",
                alignItems: "center",
            }}>
                <FontAwesomeIcon icon={faBars} size={20} color={Colors[theme].text}/>
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
            {(!followUser && phase == 0) && 
                <TouchableOpacity style={{height: 36, width: 36, backgroundColor: Colors[theme].bgDark, position: "absolute", right: 20, bottom: 280, zIndex: 1000, borderRadius: 18, justifyContent: "center", alignItems: "center"}} onPress={() => {
                    setFollowUser(true)
                }}>
                    <FontAwesomeIcon icon={faLocationCrosshairs} size={18} color={Colors[theme].text}/>
                </TouchableOpacity>
            }
            <MapView
                key={mapStyleUrl}
                ref={map}
                styleURL={mapStyleUrl}
                style={styles.map}
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
                {(phase == 4 && styleLoaded && driverRouteCoords.length > 1) && (
                    <Route key={`driver-${colorScheme}`} coordinates={driverRouteCoords} />
                )}
                {(phase == 5 && styleLoaded && tripRouteCoords.length > 1) && (
                    <Route key={`trip-complete-${colorScheme}`} coordinates={tripRouteCoords} />
                )}
                {(phase == 4 && styleLoaded && phase4EndMarkerTarget) && (
                    <MarkerView
                        key={`phase4-end-${colorScheme}`}
                        id="phase4-end"
                        coordinate={phase4EndMarkerTarget}
                        allowOverlapWithPuck={true}
                        allowOverlap={true}
                    >
                        <RouteEndpointPin type="end" />
                    </MarkerView>
                )}
                {(phase == 4 && styleLoaded && driverLocation && !tripEnded) && (
                    <MarkerView
                        key={`phase4-driver-${colorScheme}`}
                        id="phase4-driver"
                        coordinate={driverLocation}
                        allowOverlapWithPuck={true}
                        allowOverlap={true}
                    >
                        <DriverMapMarker />
                    </MarkerView>
                )}
                {(phase == 5 && styleLoaded && phase4PickupTarget) && (
                    <MarkerView
                        key={`phase5-pickup-${colorScheme}`}
                        id="phase5-pickup"
                        coordinate={phase4PickupTarget}
                        allowOverlapWithPuck={true}
                        allowOverlap={true}
                    >
                        <RouteEndpointPin type="start" />
                    </MarkerView>
                )}
                {(phase == 5 && styleLoaded && phase4DestinationTarget) && (
                    <MarkerView
                        key={`phase5-destination-${colorScheme}`}
                        id="phase5-destination"
                        coordinate={phase4DestinationTarget}
                        allowOverlapWithPuck={true}
                        allowOverlap={true}
                    >
                        <RouteEndpointPin type="end" />
                    </MarkerView>
                )}
                {(phase == 0 && location) && <LocationPuck puckBearing='heading' puckBearingEnabled scale={0.7}/>}
                <Camera
                    ref={camera}
                    defaultSettings={cameraDefaultSettings}
                    followUserLocation={followUser}
                    followZoomLevel={16}
                    followPadding={CAMERA_PADDING}
                />
                <CameraGestureObserver
                    quietPeriodMs={200}
                    maxIntervalMs={5000}
                    onMapSteady={({ nativeEvent } : { nativeEvent: OnMapSteadyEvent }) => {
                        if (nativeEvent.lastGestureType !== "pan") {
                            return;
                        }
                        if (mapSteadyHandlerRef.current) {
                            return;
                        }
                        mapSteadyHandlerRef.current = true;
                        setMoving(false);

                        const releaseSteadyLock = () => {
                            mapSteadyHandlerRef.current = false;
                        };

                        if (phase !== 0 && phase !== 2) {
                            releaseSteadyLock();
                            return;
                        }

                        if (!crosshair.current) {
                            releaseSteadyLock();
                            return;
                        }

                        crosshair.current.measure(async (x, y, width, height) => {
                            try {
                                const coords = await map.current?.getCoordinateFromView([
                                    x + width / 2.0,
                                    y + height / 2.0,
                                ]);
                                if (!coords) {
                                    return;
                                }
                                if (phase === 0) {
                                    if (!inputToggle) {
                                        setPickupCoords(coords as Position);
                                        await obtainAddressFromSearchbox(coords as Position, false);
                                    } else {
                                        setDestCoords(coords as Position);
                                        await obtainAddressFromSearchbox(coords as Position, true);
                                    }
                                } else if (phase === 2) {
                                    setPickupCoords(coords as Position);
                                    await reverseGeocodePickupForConfirm(coords as Position);
                                    const walkingCoordinates = await obtainWalkingDirections(
                                        coords as Position,
                                        userLocation
                                    );
                                    setWalkingCoordinates(walkingCoordinates);
                                }
                            } finally {
                                releaseSteadyLock();
                            }
                        });
                    }}
                />
                <Viewport onStatusChanged={(e) => {
                    if (e.reason === "UserInteraction" && followUser) {
                        setFollowUser(false);
                    }
                }}/>
            </MapView>
            <BottomSheet
                ref={bottomSheetRef}
                onChange={(idx) => {
                    if (idx == 1) {
                        if (inputToggle) destRef.current?.focus();
                        else pickupRef.current?.focus();
                    }
                }}
                backgroundStyle={{backgroundColor: Colors[theme].bgDark}}
                handleIndicatorStyle={{backgroundColor: Colors[theme].text}}
                keyboardBehavior="interactive"
                snapPoints={snapPoints}
                enableDynamicSizing={false}
                keyboardBlurBehavior='restore'
                topInset={150}
                containerStyle={{zIndex: 10000}}
            >
                <SetLocation 
                    setPhase={setPhase} 
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
                backgroundStyle={{backgroundColor: Colors[theme].bgDark}}
                handleIndicatorStyle={{backgroundColor: Colors[theme].text}}
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
                                        color={Colors[theme].text}
                                        style={{ marginLeft: 4, marginRight: 8,}}
                                    />
                                    <Text style={{color: Colors[theme].text, fontSize: 16, fontWeight: 500,}}>Apple Pay</Text>
                                </View>
                                <View style={{flex: 1, justifyContent: "center", alignItems: "flex-end"}}>
                                    <FontAwesomeIcon icon={faAngleRight} size={16} color={Colors[theme].text}/>
                                </View>
                            </TouchableOpacity>
                            <View style={{height: 50, marginHorizontal: 20, flexDirection: "row", marginBottom: 24, gap: 8,}}>
                                <TouchableOpacity 
                                    onPress={() => {
                                        setUpdated(false);
                                        setPhase(0);
                                    }}
                                    style={{width: 50, height: 50, backgroundColor: Colors[theme].text, borderRadius: 10, justifyContent: "center", alignItems: "center"}}>
                                    <FontAwesomeIcon icon={faAngleLeft} size={20} color={Colors[theme].bg}/>
                                </TouchableOpacity>
                                <TouchableOpacity 
                                    onPress={async () => {
                                        await reverseGeocodePickupForConfirm(pickupCoords);
                                        setPhase(2);
                                    }}
                                style={{flex: 1, height: 50, backgroundColor: Colors[theme].text, borderRadius: 10, justifyContent: "center", alignItems: "center"}}>
                                <Text style={{fontSize: 18, fontWeight: 500, color: Colors[theme].bg}}>Choose {rideTypeMetadata[selected]?.name}</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    onPress={() => {
                                        setRideOptionsVisible(true);
                                    }}
                                    style={{width: 50, height: 50, backgroundColor: Colors[theme].text, borderRadius: 10, justifyContent: "center", alignItems: "center"}}
                                >
                                    <FontAwesomeIcon icon={faEllipsisVertical} size={18} color={Colors[theme].bg}/>
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
                backgroundStyle={{backgroundColor: Colors[theme].bgDark}}
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
                    riderId={user?.uid}
                    price={price}
                    typeId={selected}
                    pickupCoords={pickupCoords}
                    destCoords={destCoords}
                    distance={distance}
                    duration={duration}
                    silentOnly={silentOnly}
                    femaleDriverPreferred={femaleDriverPreferred}
                    verified={verified}
                    processing={processing}
                    onRideCreated={setPendingRideId}
                />
            </BottomSheet>
            <BottomSheet 
                ref={bottomSheetRef3}
                index={-1}
                backgroundStyle={{backgroundColor: Colors[theme].bgDark}}
                handleIndicatorStyle={{backgroundColor: Colors[theme].text}}
                enableDynamicSizing={false}
                enableHandlePanningGesture={false}
                enableContentPanningGesture={false}
                enablePanDownToClose={false}
                snapPoints={snapPoints3}
                topInset={150}
                containerStyle={{zIndex: 10000}}
            >
                <FindingDriver
                    timedOut={searchTimedOut}
                    onTryAgain={() => void handleTryAgainAfterTimeout()}
                    onCancel={() => {
                        if (!cancellingRideRequest) {
                            void handleCancelRideRequest();
                        }
                    }}
                />
            </BottomSheet>
            <BottomSheet
                ref={bottomSheetRef4}
                index={-1}
                backgroundStyle={{backgroundColor: Colors[theme].bgDark}}
                handleIndicatorStyle={{backgroundColor: Colors[theme].text}}
                enableDynamicSizing={false}
                enableHandlePanningGesture={true}
                enableContentPanningGesture={true}
                enablePanDownToClose={false}
                snapPoints={snapPoints4}
                topInset={150}
                containerStyle={{zIndex: 10000}}
            >
                <BottomSheetScrollView
                    contentContainerStyle={{ paddingBottom: insets.bottom + 12 }}
                >
                    <DriverOnWay
                        pickupLabel={acceptedRide?.pickupLabel ?? null}
                        destinationLabel={acceptedRide?.destinationLabel ?? null}
                        durationMinutes={driverRouteDurationMin}
                        routeStatus={driverRouteStatus}
                        secret={acceptedRide?.secret ?? null}
                        tripStarted={tripStarted}
                        driverName={driverProfile?.name ?? "Your driver"}
                        driverRating={driverProfile?.rating ?? null}
                        vehicleDescription={driverProfile?.vehicleLabel ?? "Vehicle details coming soon"}
                        onCall={handleCallDriver}
                        onMessage={handleMessageDriver}
                        onSharePin={() => void handleSharePin()}
                        onCancelRide={() => void handleCancelActiveRide()}
                        cancelling={cancellingActiveRide}
                    />
                </BottomSheetScrollView>
            </BottomSheet>
            <BottomSheet
                ref={bottomSheetRef5}
                index={-1}
                backgroundStyle={{backgroundColor: Colors[theme].bgDark}}
                handleIndicatorStyle={{backgroundColor: Colors[theme].text}}
                enableDynamicSizing={false}
                enableHandlePanningGesture={false}
                enableContentPanningGesture={false}
                enablePanDownToClose={false}
                snapPoints={snapPoints5}
                topInset={150}
                containerStyle={{zIndex: 10000}}
            >
                <TripComplete
                    rideId={acceptedRide?.rideId ?? ""}
                    driverId={acceptedRide?.driverId ?? null}
                    destinationLabel={acceptedRide?.destinationLabel ?? null}
                    price={acceptedRide?.price ?? undefined}
                    typeId={acceptedRide?.typeId}
                    driverName={driverProfile?.name ?? "Your driver"}
                    driverRating={driverProfile?.rating ?? null}
                    vehicleDescription={driverProfile?.vehicleLabel ?? "Vehicle details coming soon"}
                    onDone={handleTripCompleteDone}
                />
            </BottomSheet>
        </GestureHandlerRootView>
    )
}

const styles = StyleSheet.create({
    root: {
        flex: 1,
    },
    map: {
        ...StyleSheet.absoluteFillObject,
    },
});
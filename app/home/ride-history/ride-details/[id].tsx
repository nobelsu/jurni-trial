import { useEffect, useMemo, useRef, useState } from "react";
import { View, Text, useColorScheme, ActivityIndicator, Dimensions, TouchableOpacity, ScrollView } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import firestore from "@react-native-firebase/firestore";
import { Colors } from "../../../../constants/Colors";
import StyleDefault from "../../../../constants/DefaultStyles";
import type { FirebaseFirestoreTypes } from "@react-native-firebase/firestore";
import type { Ride } from "../../../../lib/rides";
import { getRideTypeDisplayName } from "../../../../lib/rides";
import { MAPBOX_ACCESS_TOKEN, obtainDirections, Position, DrivingDirectionsResult } from "../../../../lib/mapbox";
import { MapView, Camera, setAccessToken } from "@rnmapbox/maps";
import Route from "../../../../components/Route";
import { computeBBox, type LatLng } from "../../../../lib/shared-util";
import BackBtn from "../../../../components/BackButton";
import BottomSheet, { BottomSheetScrollView } from "@gorhom/bottom-sheet";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useBottomSheet } from "@gorhom/bottom-sheet";
import Animated, {
  useAnimatedStyle,
  interpolate,
  Extrapolation,
  useAnimatedReaction,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { faCircleDot } from "@fortawesome/free-solid-svg-icons/faCircleDot";
import { faLocationDot } from "@fortawesome/free-solid-svg-icons/faLocationDot";
import { faStar } from "@fortawesome/free-solid-svg-icons/faStar";
import { setOrUpdateRideRating } from "../../../../lib/drivers";

function formatDateTime(timestamp: FirebaseFirestoreTypes.Timestamp | null): string {
  if (!timestamp) return "—";
  const date = timestamp.toDate();
  return date.toLocaleString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function DetailRow({ label, value }: { label: string; value: string }) {
  const colorScheme = useColorScheme();
  const defaultStyles = StyleDefault({ colorScheme });
  return (
    <View
      style={{
        flexDirection: "row",
        justifyContent: "space-between",
        paddingVertical: 8,
      }}
    >
      <Text style={{ ...defaultStyles.subtitle, flex: 1 }}>{label}</Text>
      <Text style={{ ...defaultStyles.title, fontSize: 16, flex: 1, textAlign: "right" }}>{value}</Text>
    </View>
  );
}

interface RideDetailsSheetContentProps {
  ride: Ride;
  onDeleteRide: () => void;
  deleting: boolean;
  deleteError: string | null;
  driverRating: number | null;
  onRateDriver: (rating: number) => void;
  submittingRating: boolean;
  ratingStatus: string | null;
}

function RideDetailsSheetContent({
  ride,
  onDeleteRide,
  deleting,
  deleteError,
  driverRating,
  onRateDriver,
  submittingRating,
  ratingStatus,
}: RideDetailsSheetContentProps) {
  const colorScheme = useColorScheme();
  const defaultStyles = StyleDefault({ colorScheme });
  const colors = Colors[colorScheme ?? "light"];

  const { animatedPosition } = useBottomSheet();
  const windowHeight = Dimensions.get("window").height;
  // snap 0 → sheet height 260, top edge ≈ windowHeight - 260
  // snap 1 → "100%" with topInset 150, top edge ≈ 150
  const opacity = useSharedValue(1);
  const otherOpacity = useSharedValue(0);

  useAnimatedReaction(
    () => animatedPosition.value,
        (currentPosition, previousPosition) => {
            "worklet";
            if (!previousPosition) return
            let curr = +(Math.round(Math.abs(currentPosition) - 194.0)/240.0).toFixed(1);
            let prev = +(Math.round(Math.abs(previousPosition) - 194.0)/240.0).toFixed(1);
            if (curr !== prev && curr <= 1.00 && opacity.value != curr) {
                opacity.value = withTiming(curr, { duration: 10 });
            }
            if (curr !== prev && curr >= 0.00 && otherOpacity.value != 1-curr) {
              otherOpacity.value = withTiming(1-curr, { duration: 10 });
          }
        },
        [animatedPosition],
);

  return (
    <>
      {/* Collapsed summary – fades out as sheet expands */}
      <Animated.View
        style={[
          { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 24, opacity: opacity},
        ]}
      >
        <View
          style={{
            ...defaultStyles.largeCard,
            padding: 20,
            borderWidth: 0,
            borderColor: "transparent",
          }}
        >
          <View
            style={{
              flexDirection: "row",
            }}
          >
            <View style={{ flex: 1, paddingRight: 12 }}>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <FontAwesomeIcon
                  icon={faCircleDot}
                  size={14}
                  color={colors.primary}
                />
                <Text
                  style={defaultStyles.title}
                  numberOfLines={1}
                >
                  {ride.pickup || "Pickup not recorded"}
                </Text>
              </View>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  marginTop: 4,
                  gap: 8,
                }}
              >
                <FontAwesomeIcon
                  icon={faLocationDot}
                  size={14}
                  color={colors.primary}
                />
                <Text
                  style={defaultStyles.title}
                  numberOfLines={1}
                >
                  {ride.destination || "Destination not recorded"}
                </Text>
              </View>
              <Text
                style={{
                  ...defaultStyles.subtitle,
                  marginTop: 6,
                  color: colors.textDull,
                }}
              >
                {formatDateTime(ride.created_at)}
              </Text>
            </View>
            <View
              style={{
                flex: 0,
                alignItems: "flex-end",
                justifyContent: "flex-end",
              }}
            >
              <Text
                style={{
                  ...defaultStyles.title,
                  fontSize: 18,
                }}
              >
                £{ride.price.toFixed(2)}
              </Text>
            </View>
          </View>
        </View>
        <View style={{ marginTop: 12, alignItems: "center" }}>
          <Text
            style={{
              ...defaultStyles.subtitle,
              fontSize: 14,
              color: colors.textDull,
            }}
          >
            Drag up for more details
          </Text>
        </View>
      </Animated.View>

      {/* Expanded details – fade in as sheet reaches full */}
      <Animated.View
        style={[
          {
            paddingHorizontal: 16,
            paddingTop: 16,
            paddingBottom: 24,
            position: "absolute",
            left: 0,
            right: 0,
            top: 0,
            opacity: otherOpacity,
          },
        ]}
      >
        <ScrollView showsVerticalScrollIndicator={false}>
          <View
            style={{
              ...defaultStyles.largeCard,
              padding: 20,
              borderWidth: 0,
              borderColor: "transparent",
            }}
          >
            <View
              style={{
              flexDirection: "row",
              }}
            >
              <View style={{ flex: 1, paddingRight: 12 }}>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <FontAwesomeIcon
                    icon={faCircleDot}
                    size={14}
                    color={colors.primary}
                  />
                  <Text
                    style={defaultStyles.title}
                    numberOfLines={1}
                  >
                    {ride.pickup || "Pickup not recorded"}
                  </Text>
                </View>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    marginTop: 4,
                    gap: 8,
                  }}
                >
                  <FontAwesomeIcon
                    icon={faLocationDot}
                    size={14}
                    color={colors.primary}
                  />
                  <Text
                    style={defaultStyles.title}
                    numberOfLines={1}
                  >
                    {ride.destination || "Destination not recorded"}
                  </Text>
                </View>
                <Text
                  style={{
                    ...defaultStyles.subtitle,
                    marginTop: 6,
                    color: colors.textDull,
                  }}
                >
                  {formatDateTime(ride.created_at)}
                </Text>
              </View>
              <View
                style={{
                flex: 0,
                  alignItems: "flex-end",
                  justifyContent: "flex-end",
                }}
              >
                <Text
                  style={{
                    ...defaultStyles.title,
                    fontSize: 18,
                  }}
                >
                  £{ride.price.toFixed(2)}
                </Text>
              </View>
            </View>

            <View style={{ marginTop: 16 }}>
              <DetailRow
                label="Ride type"
                value={getRideTypeDisplayName(ride.type_id)}
              />
              <DetailRow
                label="Driver"
                value={ride.driver_id || "—"}
              />
              <DetailRow
                label="Requested at"
                value={formatDateTime(ride.created_at)}
              />
              <DetailRow
                label="Started at"
                value={formatDateTime(ride.started_at)}
              />
              <DetailRow
                label="Ended at"
                value={formatDateTime(ride.ended_at)}
              />
            </View>
            {ride.driver_id && ride.ended_at ? (
              <View style={{ marginTop: 24 }}>
                <Text
                  style={{
                    ...defaultStyles.subtitle,
                    marginBottom: 8,
                    color: colors.text,
                    fontSize: 14,
                  }}
                >
                  Rate your driver
                </Text>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 12,
                    marginBottom: 8,
                  }}
                >
                  {[1, 2, 3, 4, 5].map((star) => (
                    <TouchableOpacity
                      key={star}
                      disabled={submittingRating}
                      onPress={() => onRateDriver(star)}
                      style={{ padding: 4 }}
                    >
                      <FontAwesomeIcon
                        icon={faStar}
                        size={20}
                        color={
                          (driverRating ?? 0) >= star
                            ? colors.primary
                            : colors.textDull
                        }
                      />
                    </TouchableOpacity>
                  ))}
                </View>
                <Text
                  style={{
                    ...defaultStyles.subtitle,
                    fontSize: 12,
                    color: colors.textDull,
                  }}
                >
                  {ratingStatus
                    ? ratingStatus
                    : driverRating
                    ? `You rated this driver ${driverRating}/5.`
                    : "Tap a star to rate this ride's driver."}
                </Text>
              </View>
            ) : null}

            {ride.ended_at ? (
              <View style={{ marginTop: 24 }}>
                {deleteError ? (
                  <Text
                    style={{
                      ...defaultStyles.subtitle,
                      fontSize: 12,
                      color: colors.primary,
                      marginBottom: 8,
                    }}
                  >
                    {deleteError}
                  </Text>
                ) : null}
                <TouchableOpacity
                  onPress={onDeleteRide}
                  disabled={deleting}
                  style={{
                    marginTop: 4,
                    paddingVertical: 12,
                    borderRadius: 10,
                    backgroundColor: "#d9534f",
                    alignItems: "center",
                    opacity: deleting ? 0.6 : 1,
                  }}
                >
                  <Text
                    style={{
                      ...defaultStyles.title,
                      fontSize: 16,
                      color: "#fff",
                    }}
                  >
                    {deleting ? "Deleting ride…" : "Delete ride"}
                  </Text>
                </TouchableOpacity>
              </View>
            ) : null}
          </View>
        </ScrollView>
      </Animated.View>
    </>
  );
}

export default function RideDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const defaultStyles = StyleDefault({ colorScheme });
  const colors = Colors[colorScheme ?? "light"];
  const [ride, setRide] = useState<Ride | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [routeCoords, setRouteCoords] = useState<Position[]>([]);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [driverRating, setDriverRating] = useState<number | null>(null);
  const [submittingRating, setSubmittingRating] = useState(false);
  const [ratingStatus, setRatingStatus] = useState<string | null>(null);
  const [routeError, setRouteError] = useState<string | null>(null);

  const cameraRef = useRef<Camera | null>(null);
  const bottomSheetRef = useRef<BottomSheet | null>(null);

  useEffect(() => {
    setAccessToken(MAPBOX_ACCESS_TOKEN);
  }, []);

  useEffect(() => {
    if (!id) {
      setError("Missing ride id");
      setLoading(false);
      return;
    }
    const unsubscribe = firestore()
      .collection("rides")
      .doc(id)
      .onSnapshot(
        (snapshot) => {
          if (!snapshot.exists) {
            setError("Ride not found");
            setRide(null);
          } else {
            const d = snapshot.data()!;
            setRide({
              id: snapshot.id,
              rider_id: d.rider_id ?? "",
              type_id: d.type_id ?? "basic",
              price: typeof d.price === "number" ? d.price : 0,
              status: d.status ?? "",
              driver_id: d.driver_id ?? "",
              created_at: d.created_at ?? null,
              started_at: d.started_at ?? null,
              accepted_at: d.accepted_at ?? null,
              ended_at: d.ended_at ?? null,
              pickup: d.pickup ?? null,
              destination: d.destination ?? null,
              pickup_geopoint: d.pickup_geopoint ?? null,
              destination_geopoint: d.destination_geopoint ?? null,
            });
            if (typeof d.driver_rating === "number") {
              setDriverRating(d.driver_rating);
            } else {
              setDriverRating(null);
            }
          }
          setLoading(false);
        },
        (err) => {
          setError(err.message ?? "Failed to load ride");
          setLoading(false);
        }
      );
    return () => unsubscribe();
  }, [id]);

  const canShowRoute =
    !!ride?.pickup_geopoint &&
    !!ride?.destination_geopoint &&
    typeof ride.pickup_geopoint.latitude === "number" &&
    typeof ride.pickup_geopoint.longitude === "number" &&
    typeof ride.destination_geopoint.latitude === "number" &&
    typeof ride.destination_geopoint.longitude === "number";

  useEffect(() => {
    if (!canShowRoute || !ride?.pickup_geopoint || !ride?.destination_geopoint) {
      setRouteCoords([]);
      setRouteError(null);
      return;
    }
    const pickupPos: Position = [
      ride.pickup_geopoint.longitude,
      ride.pickup_geopoint.latitude,
    ];
    const destPos: Position = [
      ride.destination_geopoint.longitude,
      ride.destination_geopoint.latitude,
    ];

    obtainDirections(pickupPos, destPos)
      .then((res: DrivingDirectionsResult) => {
        if (res.kind === "no_route") {
          setRouteCoords([]);
          setRouteError("No driving route is available to display this trip.");
          return;
        }
        setRouteError(null);
        setRouteCoords(res.coordinates as Position[]);
      })
      .catch((e) => {
        console.log("Failed to load route for ride details", e);
        setRouteCoords([]);
        setRouteError("Failed to load route for this trip.");
      });
  }, [canShowRoute, ride?.pickup_geopoint, ride?.destination_geopoint]);

  const bounds = useMemo(() => {
    if (!canShowRoute || routeCoords.length === 0) return null;
    // convert [lng, lat] -> [lat, lng] for computeBBox
    const latLngCoords: LatLng[] = routeCoords.map(([lng, lat]) => [lat, lng]);
    const bbox = computeBBox(latLngCoords);
    const ne: Position = [bbox.maxLng, bbox.maxLat];
    const sw: Position = [bbox.minLng, bbox.minLat];
    const center: Position = [
      (ne[0] + sw[0]) / 2,
      (ne[1] + sw[1]) / 2,
    ];
    const spanLat = bbox.maxLat - bbox.minLat;
    const spanLng = bbox.maxLng - bbox.minLng;
    return { ne, sw, center, spanLat, spanLng };
  }, [canShowRoute, routeCoords]);

  const cameraBounds = useMemo(() => {
    if (!bounds) return undefined;
    return {
      ne: bounds.ne,
      sw: bounds.sw,
      paddingTop: 40,
      paddingRight: 40,
      paddingBottom: 280,
      paddingLeft: 40,
    };
  }, [bounds]);

  const handleDeleteRide = async () => {
    if (!ride) return;
    try {
      setDeleteError(null);
      setDeleting(true);
      await firestore().collection("rides").doc(ride.id).delete();
      router.back();
    } catch (e) {
      console.log("Failed to delete ride from details", e);
      setDeleteError(
        e instanceof Error ? e.message : "Failed to delete ride. Please try again."
      );
    } finally {
      setDeleting(false);
    }
  };

  const handleRateDriver = async (rating: number) => {
    if (!ride || !ride.driver_id) return;
    try {
      setSubmittingRating(true);
      setRatingStatus(null);
      await setOrUpdateRideRating(ride.id, ride.driver_id, rating);
      setDriverRating(rating);
      setRatingStatus("Thanks for rating your driver.");
    } catch (e) {
      console.log("Failed to rate driver", e);
      setRatingStatus(
        e instanceof Error
          ? e.message
          : "Failed to submit rating. Please try again."
      );
    } finally {
      setSubmittingRating(false);
    }
  };

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: colors.bgDark,
        }}
      >
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (error || !ride) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: colors.bgDark,
        }}
      >
        <Text style={[defaultStyles.subtitle, { color: colors.primary }]}>
          {error ?? "Ride not found"}
        </Text>
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.bgDark }}>
      <View style={{ flex: 1, overflow: "hidden" }}>
        {canShowRoute && bounds && routeCoords.length > 0 && (
          <MapView
            style={{ flex: 1 }}
            styleURL={
              colorScheme === "light"
                ? "mapbox://styles/mapbox/light-v11"
                : "mapbox://styles/mapbox/dark-v11"
            }
            logoEnabled={false}
            scaleBarEnabled={false}
            attributionEnabled={false}
          >
            <Camera
              ref={cameraRef}
              bounds={cameraBounds}
              animationDuration={0}
              animationMode="none"
            />
            <Route coordinates={routeCoords} />
          </MapView>
        )}
        {routeError && (
          <View
            style={{
              position: "absolute",
              bottom: 280,
              left: 20,
              right: 20,
              paddingVertical: 8,
              paddingHorizontal: 12,
              borderRadius: 10,
              backgroundColor: colors.bg,
              borderWidth: 1,
              borderColor: colors.textDull,
            }}
          >
            <Text
              style={{
                ...defaultStyles.subtitle,
                fontSize: 13,
                textAlign: "center",
                color: colors.text,
              }}
            >
              {routeError}
            </Text>
          </View>
        )}

        <View
          style={{
            position: "absolute",
            top: 60,
            left: 20,
          }}
        >
          <BackBtn onPress={() => router.back()} />
        </View>
      </View>

      <BottomSheet
        ref={bottomSheetRef}
        index={0}
        snapPoints={[260, 500]}
        topInset={150}
        backgroundStyle={{ backgroundColor: colors.bgDark }}
        handleIndicatorStyle={{ backgroundColor: colors.text }}
        onChange={(idx) => {
          if (!bounds || !cameraRef.current) return;
          if (idx === 0)cameraRef.current.fitBounds(bounds.ne, bounds.sw, [80, 40, 280, 40], 800);
          else cameraRef.current.fitBounds(bounds.ne, bounds.sw, [80, 40, 520, 40], 800);
        }}
      >
        <BottomSheetScrollView>
          <RideDetailsSheetContent
            ride={ride}
            onDeleteRide={handleDeleteRide}
            deleting={deleting}
            deleteError={deleteError}
            driverRating={driverRating}
            onRateDriver={handleRateDriver}
            submittingRating={submittingRating}
            ratingStatus={ratingStatus}
          />
        </BottomSheetScrollView>
      </BottomSheet>
    </GestureHandlerRootView>
  );
}

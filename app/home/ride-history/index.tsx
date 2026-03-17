import { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  useColorScheme,
  ActivityIndicator,
} from "react-native";
import { Swipeable } from "react-native-gesture-handler";
import { useNavigation, useRouter } from "expo-router";
import { DrawerActions } from "@react-navigation/native";
import { getAuth } from "@react-native-firebase/auth";
import firestore from "@react-native-firebase/firestore";
import { SafeAreaView } from "react-native-safe-area-context";
import { Colors } from "../../../constants/Colors";
import StyleDefault from "../../../constants/DefaultStyles";
import type { FirebaseFirestoreTypes } from "@react-native-firebase/firestore";
import type { Ride } from "../../../lib/rides";
import { getRideTypeDisplayName } from "../../../lib/rides";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { faBars } from "@fortawesome/free-solid-svg-icons/faBars";

function formatRideDate(timestamp: FirebaseFirestoreTypes.Timestamp | null): string {
  if (!timestamp) return "—";
  const date = timestamp.toDate();
  return date.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function RideHistoryScreen() {
  const colorScheme = useColorScheme();
  const defaultStyles = StyleDefault({ colorScheme });
  const colors = Colors[colorScheme ?? "light"];
  const router = useRouter();
  const navigation = useNavigation();
  const [rides, setRides] = useState<Ride[]>([]);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const user = getAuth().currentUser;

  const loadRides = useCallback(() => {
    if (!user?.uid) {
      setRides([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    // Requires Firestore composite index: rides (rider_id ASC, created_at DESC)
    const unsubscribe = firestore()
      .collection("rides")
      .where("rider_id", "==", user.uid)
      .orderBy("created_at", "desc")
      .limit(50)
      .onSnapshot(
        (snapshot) => {
          const list: Ride[] = snapshot.docs.map((doc) => {
            const d = doc.data();
            return {
              id: doc.id,
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
            };
          });
          setRides(list);
          setLoading(false);
        },
        (err) => {
          console.log(err.message)
          setError(err.message ?? "Failed to load rides");
          setLoading(false);
        }
      );
    return unsubscribe;
  }, [user?.uid]);

  const handleDeleteRide = useCallback(
    async (rideId: string) => {
      try {
        setDeletingId(rideId);
        // Optimistic update
        setRides((prev) => prev.filter((r) => r.id !== rideId));
        await firestore().collection("rides").doc(rideId).delete();
      } catch (e) {
        console.log("Failed to delete ride", e);
        // If delete fails, reload from server on next snapshot; for now we rely on listener to correct state.
      } finally {
        setDeletingId((current) => (current === rideId ? null : current));
      }
    },
    []
  );

  useEffect(() => {
    const unsub = loadRides();
    return () => {
      if (typeof unsub === "function") unsub();
    };
  }, [loadRides]);

  if (!user) {
    return (
      <SafeAreaView style={[defaultStyles.container, { flex: 1, justifyContent: "center", alignItems: "center" }]}>
        <Text style={defaultStyles.subtitle}>Sign in to see your ride history.</Text>
      </SafeAreaView>
    );
  }

  if (loading && rides.length === 0) {
    return (
      <SafeAreaView style={[defaultStyles.container, { flex: 1, justifyContent: "center", alignItems: "center" }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={[defaultStyles.container, { flex: 1, justifyContent: "center", alignItems: "center" }]}>
        <Text style={[defaultStyles.subtitle, { color: colors.primary }]}>{error}</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={defaultStyles.container} edges={["bottom"]}>
      <FlatList
        data={rides}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 24 }}
        ListHeaderComponent={
          <View
            style={{
              paddingTop: 60,
              paddingBottom: 16,
              paddingHorizontal: 20,
              flexDirection: "row",
              alignItems: "center",
            }}
          >
            <TouchableOpacity
              onPress={() => {
                navigation.dispatch(DrawerActions.toggleDrawer());
              }}
              style={{
                height: 40,
                width: 40,
                borderRadius: 20,
                backgroundColor: Colors[colorScheme ?? "light"].bgDark,
                justifyContent: "center",
                alignItems: "center",
                marginRight: 16,
              }}
            >
              <FontAwesomeIcon
                icon={faBars}
                size={18}
                color={Colors[colorScheme ?? "light"].text}
              />
            </TouchableOpacity>
            <Text style={{ ...defaultStyles.title, fontSize: 24 }}>
              Ride history
            </Text>
          </View>
        }
        ListEmptyComponent={
          <View style={{ paddingVertical: 48, alignItems: "center" }}>
            <Text style={defaultStyles.subtitle}>No rides yet</Text>
          </View>
        }
        renderItem={({ item }) => (
          <Swipeable
            renderRightActions={() =>
              item.ended_at
                ? (
                  <View
                    style={{
                      justifyContent: "center",
                      alignItems: "flex-end",
                      marginBottom: 12,
                      paddingRight: 20,
                    }}
                  >
                    <TouchableOpacity
                      onPress={() => handleDeleteRide(item.id)}
                      disabled={deletingId === item.id}
                      style={{
                        backgroundColor: "#d9534f",
                        paddingHorizontal: 10,
                        paddingVertical: 12,
                        borderRadius: 12,
                        marginLeft: 10,
                        opacity: deletingId === item.id ? 0.6 : 1,
                      }}
                    >
                      <Text
                        style={{
                          color: "#fff",
                          fontFamily: "Outfit_600SemiBold",
                          fontSize: 14,
                        }}
                      >
                        Delete
                      </Text>
                    </TouchableOpacity>
                  </View>
                )
                : null
            }
          >
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => router.push(`/home/ride-history/ride-details/${item.id}`)}
              style={{
                ...defaultStyles.mediumCard,
                padding: 16,
                marginBottom: 12,
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                }}
              >
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      ...defaultStyles.title,
                      fontSize: 16,
                      marginBottom: 4,
                    }}
                  >
                    {getRideTypeDisplayName(item.type_id)}
                  </Text>
                  <Text style={{ ...defaultStyles.subtitle, fontSize: 14 }}>
                    {formatRideDate(item.created_at)}
                  </Text>
                  {(item.pickup || item.destination) ? (
                    <Text
                      style={{
                        ...defaultStyles.subtitle,
                        fontSize: 12,
                        marginTop: 4,
                      }}
                      numberOfLines={1}
                    >
                      {[item.pickup, item.destination].filter(Boolean).join(" → ")}
                    </Text>
                  ) : null}
                </View>
                <View
                  style={{
                    justifyContent: "flex-end",
                    alignItems: "flex-end",
                  }}
                >
                  <Text
                    style={{
                      fontFamily: "Outfit_600SemiBold",
                      fontSize: 18,
                      color: colors.text,
                    }}
                  >
                    £{item.price.toFixed(2)}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          </Swipeable>
        )}
      />
    </SafeAreaView>
  );
}

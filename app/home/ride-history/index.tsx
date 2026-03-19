import { useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  SectionList,
  TouchableOpacity,
  useColorScheme,
  ActivityIndicator,
  TextInput,
  ScrollView,
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
import { faCircleDot } from "@fortawesome/free-solid-svg-icons/faCircleDot";
import { faLocationDot } from "@fortawesome/free-solid-svg-icons/faLocationDot";
import { faMagnifyingGlass } from "@fortawesome/free-solid-svg-icons/faMagnifyingGlass";
type FilterId = "all" | "completed" | "active";

const FILTERS: { id: FilterId; label: string }[] = [
  { id: "all", label: "All" },
  { id: "completed", label: "Completed" },
  { id: "active", label: "Active" },
];

function formatTime(timestamp: FirebaseFirestoreTypes.Timestamp | null): string {
  if (!timestamp) return "";
  const date = timestamp.toDate();
  return date.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
}

function formatSectionDate(timestamp: FirebaseFirestoreTypes.Timestamp | null): string {
  if (!timestamp) return "Unknown date";
  const date = timestamp.toDate();
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  if (date.toDateString() === today.toDateString()) return "Today";
  if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
  return date.toLocaleDateString(undefined, {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function groupRidesByDate(rides: Ride[]): { title: string; data: Ride[] }[] {
  const groups: Record<string, Ride[]> = {};
  const order: string[] = [];

  for (const ride of rides) {
    const dateStr = ride.created_at
      ? ride.created_at.toDate().toDateString()
      : "__unknown__";
    if (!groups[dateStr]) {
      groups[dateStr] = [];
      order.push(dateStr);
    }
    groups[dateStr].push(ride);
  }

  return order.map((dateStr) => ({
    title: dateStr === "__unknown__" ? "Unknown date" : formatSectionDate(groups[dateStr][0].created_at),
    data: groups[dateStr],
  }));
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
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterId>("all");

  const user = getAuth().currentUser;

  const loadRides = useCallback(() => {
    if (!user?.uid) {
      setRides([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
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
          setError(err.message ?? "Failed to load rides");
          setLoading(false);
        }
      );
    return unsubscribe;
  }, [user?.uid]);

  const handleDeleteRide = useCallback(async (rideId: string) => {
    try {
      setDeletingId(rideId);
      setRides((prev) => prev.filter((r) => r.id !== rideId));
      await firestore().collection("rides").doc(rideId).delete();
    } catch (e) {
      console.log("Failed to delete ride", e);
    } finally {
      setDeletingId((current) => (current === rideId ? null : current));
    }
  }, []);

  useEffect(() => {
    const unsub = loadRides();
    return () => {
      if (typeof unsub === "function") unsub();
    };
  }, [loadRides]);

  const filteredRides = useMemo(() => {
    let result = rides;
    if (activeFilter === "completed") {
      result = result.filter((r) => !!r.ended_at);
    } else if (activeFilter === "active") {
      result = result.filter((r) => !r.ended_at);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (r) =>
          r.pickup?.toLowerCase().includes(q) ||
          r.destination?.toLowerCase().includes(q)
      );
    }
    return result;
  }, [rides, activeFilter, searchQuery]);

  const sections = useMemo(() => groupRidesByDate(filteredRides), [filteredRides]);

  if (!user) {
    return (
      <SafeAreaView style={[defaultStyles.container, { flex: 1, justifyContent: "center", alignItems: "center" }]}>
        <Text style={defaultStyles.subtitle}>Sign in to see your ride history.</Text>
      </SafeAreaView>
    );
  }

  if (loading && rides.length === 0) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: colors.bgDark }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: colors.bgDark }}>
        <Text style={[defaultStyles.subtitle, { color: colors.primary }]}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.bgDark }}>
      {/* Drawer button — same position and style as map page */}
      <TouchableOpacity
        onPress={() => navigation.dispatch(DrawerActions.toggleDrawer())}
        style={{
          position: "absolute",
          height: 50,
          width: 50,
          borderRadius: 100,
          backgroundColor: colors.bgDark,
          top: 60,
          left: 20,
          zIndex: 1000,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <FontAwesomeIcon icon={faBars} size={20} color={colors.text} />
      </TouchableOpacity>

      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 32 }}
        stickySectionHeadersEnabled={false}
        ListHeaderComponent={
          <View style={{ paddingTop: 120, paddingHorizontal: 20, paddingBottom: 12 }}>
            <Text style={{ ...defaultStyles.title, fontSize: 28, marginBottom: 16 }}>
              Ride history
            </Text>

            {/* Search bar */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                backgroundColor: colors.bg,
                borderRadius: 12,
                paddingHorizontal: 14,
                paddingVertical: 10,
                marginBottom: 12,
                gap: 10,
              }}
            >
              <FontAwesomeIcon icon={faMagnifyingGlass} size={16} color={colors.textDull} />
              <TextInput
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Search by pickup or destination"
                placeholderTextColor={colors.textDull}
                style={{
                  flex: 1,
                  fontFamily: "Outfit_400Regular",
                  fontSize: 15,
                  color: colors.text,
                  padding: 0,
                }}
                clearButtonMode="while-editing"
                returnKeyType="search"
              />
            </View>

            {/* Filter chips */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={{ flexDirection: "row", gap: 8 }}>
                {FILTERS.map((f) => {
                  const active = activeFilter === f.id;
                  return (
                    <TouchableOpacity
                      key={f.id}
                      onPress={() => setActiveFilter(f.id)}
                      style={{
                        paddingHorizontal: 16,
                        paddingVertical: 8,
                        borderRadius: 20,
                        backgroundColor: active ? colors.primary : colors.bg,
                      }}
                    >
                      <Text
                        style={{
                          fontFamily: "Outfit_600SemiBold",
                          fontSize: 14,
                          color: active ? "#fff" : colors.text,
                        }}
                      >
                        {f.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>
          </View>
        }
        ListEmptyComponent={
          <View style={{ paddingVertical: 48, alignItems: "center" }}>
            <Text style={defaultStyles.subtitle}>
              {searchQuery || activeFilter !== "all" ? "No matching rides" : "No rides yet"}
            </Text>
          </View>
        }
        renderSectionHeader={({ section: { title } }) => (
          <View style={{ paddingHorizontal: 20, paddingTop: 20, paddingBottom: 8 }}>
            <Text
              style={{
                fontFamily: "Outfit_600SemiBold",
                fontSize: 13,
                color: colors.textDull,
                textTransform: "uppercase",
                letterSpacing: 0.8,
              }}
            >
              {title}
            </Text>
          </View>
        )}
        renderItem={({ item }) => (
          <Swipeable
            renderRightActions={() =>
              item.ended_at ? (
                <View
                  style={{
                    justifyContent: "center",
                    alignItems: "flex-end",
                    marginBottom: 10,
                    paddingRight: 20,
                  }}
                >
                  <TouchableOpacity
                    onPress={() => handleDeleteRide(item.id)}
                    disabled={deletingId === item.id}
                    style={{
                      backgroundColor: "#d9534f",
                      paddingHorizontal: 14,
                      paddingVertical: 14,
                      borderRadius: 12,
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
              ) : null
            }
          >
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => router.push(`/home/ride-history/ride-details/${item.id}`)}
              style={{
                ...defaultStyles.mediumCard,
                marginHorizontal: 20,
                marginBottom: 10,
                padding: 16,
              }}
            >
              {/* Pickup row */}
              <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                <FontAwesomeIcon icon={faCircleDot} size={13} color={colors.primary} />
                <Text
                  numberOfLines={1}
                  style={{
                    flex: 1,
                    fontFamily: "Outfit_600SemiBold",
                    fontSize: 15,
                    color: colors.text,
                  }}
                >
                  {item.pickup || "Pickup not recorded"}
                </Text>
              </View>

              {/* Connector line */}
              <View
                style={{
                  width: 1,
                  height: 10,
                  backgroundColor: colors.textDull,
                  marginLeft: 6,
                  marginVertical: 3,
                  opacity: 0.5,
                }}
              />

              {/* Destination row */}
              <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                <FontAwesomeIcon icon={faLocationDot} size={13} color={colors.primary} />
                <Text
                  numberOfLines={1}
                  style={{
                    flex: 1,
                    fontFamily: "Outfit_400Regular",
                    fontSize: 15,
                    color: colors.text,
                  }}
                >
                  {item.destination || "Destination not recorded"}
                </Text>
              </View>

              {/* Footer row */}
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginTop: 12,
                }}
              >
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                  <View
                    style={{
                      paddingHorizontal: 8,
                      paddingVertical: 3,
                      borderRadius: 6,
                      backgroundColor: colors.bg,
                    }}
                  >
                    <Text
                      style={{
                        fontFamily: "Outfit_600SemiBold",
                        fontSize: 12,
                        color: colors.textDull,
                      }}
                    >
                      {getRideTypeDisplayName(item.type_id)}
                    </Text>
                  </View>
                  {item.created_at ? (
                    <Text
                      style={{
                        fontFamily: "Outfit_400Regular",
                        fontSize: 13,
                        color: colors.textDull,
                      }}
                    >
                      {formatTime(item.created_at)}
                    </Text>
                  ) : null}
                </View>
                <Text
                  style={{
                    fontFamily: "Outfit_600SemiBold",
                    fontSize: 17,
                    color: colors.text,
                  }}
                >
                  £{item.price.toFixed(2)}
                </Text>
              </View>
            </TouchableOpacity>
          </Swipeable>
        )}
      />
    </View>
  );
}

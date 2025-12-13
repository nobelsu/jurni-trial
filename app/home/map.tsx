import { View, Text, useColorScheme, StyleSheet, TextInput, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DrawerToggleButton } from '@react-navigation/drawer';
import MapView from 'react-native-maps';
import BottomSheetModal, { BottomSheetTextInput, BottomSheetView, BottomSheetScrollView, BottomSheetFooter} from '@gorhom/bottom-sheet';
import StyleDefault from '../../constants/DefaultStyles';
import { useRef, useCallback, useMemo, useState, useEffect } from 'react';
import * as Location from 'expo-location';
import { Colors } from '../../constants/Colors';
import { useSharedValue } from 'react-native-reanimated';
import { GestureHandlerRootView, ScrollView } from 'react-native-gesture-handler';
import {Dimensions} from 'react-native';
import Btn from '../../components/CustomButton';

export default function MapScreen() {
    const colorScheme = useColorScheme();
    const defaultStyles = StyleDefault({ colorScheme });
    const bottomSheetRef = useRef<BottomSheetModal>(null);
    const snapPoints = useMemo(() =>  [280, "100%"], []);
    const snapPoints1 = useMemo(() => [400, "100%"], []);
    const snapPoints2 = useMemo(() => [390, "100%"], []);
    const snapPoints3 = useMemo(() => [500, "100%"], []);

    const pickupData = [
        { "id": "P1", "location": "Warehouse Alpha", "address": "123 Industrial Park Rd, Springfield" },
        { "id": "P2", "location": "North Loading Bay", "address": "48 Maple Street, Riverside" },
        { "id": "P3", "location": "South Depot", "address": "900 Logistics Ave, Hillview" },
        { "id": "P4", "location": "East Storage Facility", "address": "221 Eastline Dr, Brookfield" },
        { "id": "P5", "location": "West Cargo Center", "address": "765 Westport Ave, Fairview" },
        { "id": "P6", "location": "Central Pickup Hub", "address": "12 Market Plaza, Greenford" },
        { "id": "P7", "location": "Logistics Point A", "address": "34 Transport Ln, Milltown" },
        { "id": "P8", "location": "Freight Terminal 3", "address": "580 Terminal Blvd, Oakridge" },
        { "id": "P9", "location": "Main Supply Depot", "address": "410 Supply St, Westhaven" }
    ];

    const destinationData = [
        { "id": "D1", "location": "Retail Store Central", "address": "501 Commerce Blvd, Lakewood" },
        { "id": "D2", "location": "Customer Dropoff Zone A", "address": "77 Oakridge Lane, Meadowview" },
        { "id": "D3", "location": "Regional Distribution Center", "address": "200 Transit Way, Pinecrest" },
        { "id": "D4", "location": "Express Delivery Point", "address": "5 Sunrise Drive, Fairmont" },
        { "id": "D5", "location": "Supermarket Hub", "address": "890 Market St, Cedarview" },
        { "id": "D6", "location": "Corporate Office Tower", "address": "300 Skyline Ave, Metro City" },
        { "id": "D7", "location": "Southern Retail Outlet", "address": "64 Horizon Rd, Southport" },
        { "id": "D8", "location": "Northern Distribution Hub", "address": "910 Northway Blvd, Highland" },
        { "id": "D9", "location": "Residential Delivery Zone B", "address": "22 Elmwood Ct, Riverton" }
    ];

    const rideTypeData = [
        {
            "id": 0, 
            "type": "JurniX", 
            "est_time": "1.09 pm",
            "away_time": "3", 
            "passengers": "4", 
            "price_new": "£3.00", 
            "price_ori": "£5.00",
            "description": "Faster speeds"
        },
        {
            "id": 1, 
            "type": "Regular", 
            "est_time": "1.12 pm",
            "away_time": "6", 
            "passengers": "4", 
            "price_new": "£2.50", 
            "price_ori": "£4.00",
            "description": "The original"
        }, 
        {
            "id": 2, 
            "type": "Jurni+", 
            "est_time": "1.14 pm",
            "away_time": "8", 
            "passengers": "6", 
            "price_new": "£8.00", 
            "price_ori": "£12.50",
            "description": "Larger sizes"
        }
    ]

    const rideSummaryData = [
        {"name": "Price", "value": "£3.00"},
        {"name": "Date", "value": "December 11, 2025"},
        {"name": "Pickup", "value": "123 Industrial Park Rd, Springfield"},
        {"name": "Destination", "value": "77 Oakridge Lane, Meadowview"},
        {"name": "Ride", "value": "JurniX"},
    ]

    const [location, setLocation] = useState<Location.LocationObject | null>(null);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [result, setResult] = useState<any>(null);
    const [loaded, setLoaded] = useState<Boolean>(false);

    const [btnText, setBtnText] = useState<string>("Search destination");
    const [title0, setTitle0] = useState<string>("Set your destination");
    const [subtitle0, setSubtitle0] = useState<string>("Where would you like to go, Nobel?")
    const [pickupInput, setPickupInput] = useState<string>("Jln. Jendral Sudirman Kav. 52-53");
    const [destInput, setDestInput] = useState<string>("");
    const [data, setData] = useState<Array<any>>(destinationData);

    const [title1, setTitle1] = useState<string>("Tap to select");
    const [subtitle1, setSubtitle1] = useState<string>("You've got options.");
    const [selected, setSelected] = useState<number>(0);
    const [confirmed, setConfirmed] = useState<Boolean>(false);


    const [phase, setPhase] = useState<number>(0);

    const windowWidth = Dimensions.get('window').width;
    const windowHeight = Dimensions.get('window').height;

    useEffect(() => {
        async function getCurrentLocation() {
        
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
            setErrorMsg('Permission to access location was denied');
            return;
        }

        let location = await Location.getCurrentPositionAsync({});
        setLocation(location);
        }

        getCurrentLocation();

    }, []);

    useEffect(() => {
        if (!pickupInput) {
            setBtnText("Search pickup")
            setTitle0("Set your pickup")
            setSubtitle0("Where'd you like to meet your driver?")
            setData(pickupData)
        } else if (!destInput) {
            setBtnText("Search destination")
            setTitle0("Set your destination")
            setSubtitle0("Where'd you like to go today?")
            setData(destinationData)
        } else {
            setBtnText("Confirm details")
            setTitle0("Plan your ride")
            setSubtitle0("Ready for a Jurni?")
            setData(destinationData)
        }
    }, [destInput, pickupInput])

    useEffect(() => {
        if (location && !result) {
            setResult(JSON.parse(JSON.stringify(location)));
            setLoaded(true);
        }
    }, [location]) 

    return (
        <GestureHandlerRootView style={{flex: 1,}}>
            <View style={{
                position: "absolute",
                height: 50,
                width: 50,
                borderRadius: 100,
                backgroundColor: "white",
                top: 60,
                left: 20,
                zIndex: 1000,
                justifyContent: "center",
                alignItems: "center",
            }}>
                <DrawerToggleButton />
            </View>
            {loaded ? <MapView
                initialRegion={{
                    latitude: result.coords.latitude,
                    longitude: result.coords.longitude,
                    latitudeDelta: 0.01,
                    longitudeDelta: 0.01,
                }}
                showsUserLocation={true}
                style={{
                    flex: 1,
                }}
            />
            :
            <View style={{flex: 1, backgroundColor: "white",}}>
                <Text>
                    {errorMsg}
                </Text>
            </View>
            }
            
            <BottomSheetModal
                ref={bottomSheetRef}
                onChange={(idx) => {
                    if ((idx == 1) && (phase == 1)) {
                        setConfirmed(false);
                        setTitle1("Tap to select");
                        setSubtitle1("You've got options.");
                    }
                }}
                keyboardBehavior="interactive"
                snapPoints={ phase == 0 ? snapPoints : phase == 1 ? snapPoints1 : phase == 2 ? snapPoints2 : snapPoints3}
                enableDynamicSizing={false}
                keyboardBlurBehavior='restore'
                topInset={150}
                footerComponent={(props) => {
                    if (phase == 0) {
                        return (
                            <BottomSheetFooter {...props}>
                                <View style={{width: "100%", paddingHorizontal: 20, backgroundColor: "white", paddingBottom: 40,}}>
                                    <Btn styleBtn={{}} styleTxt={{ fontWeight: 600,}} text={btnText} onPress={() => {
                                        if (destInput && pickupInput) {
                                            setPhase(1);
                                        } 
                                        bottomSheetRef.current?.snapToIndex(1);
                                    }}/>
                                </View>
                            </BottomSheetFooter>
                        )
                    } else if (phase == 1) {
                        return (
                            <BottomSheetFooter {...props}>
                                <View style={{width: "100%", paddingHorizontal: 20, backgroundColor: "white", paddingBottom: 40,}}>
                                    <Btn onPress={() => {
                                        if (confirmed) {
                                            setConfirmed(false); 
                                            setTitle1("Tap to select");
                                            setSubtitle1("You've got options.");
                                            bottomSheetRef.current?.snapToIndex(1);
                                        }
                                        else {
                                            setPhase(0);
                                        }
                                    }} styleTxt={{fontWeight: 600,}} text={confirmed ? "Cancel" : "Return"}/>
                                </View>
                            </BottomSheetFooter>
                        )
                    } else if (phase == 2) {
                        return (
                            <BottomSheetFooter {...props}>
                                <View style={{width: "100%", paddingHorizontal: 20, backgroundColor: "white", paddingBottom: 40, gap: 10,}}>
                                    <Btn onPress={() => {
                                        setPhase(3);
                                        bottomSheetRef.current?.snapToIndex(0);
                                    }} styleTxt={{fontWeight: 600, color: Colors[colorScheme ?? "light"].primary,}} styleBtn={{
                                        borderWidth: 3,
                                        borderColor: Colors[colorScheme ?? "light"].primary,
                                        backgroundColor: "white",
                                    }} text="Request Ride"/>
                                    <Btn onPress={() => {setPhase(1)}} styleTxt={{fontWeight: 600,}} text="Return"/>
                                </View>
                            </BottomSheetFooter>
                        )
                    }
                    return (
                        <BottomSheetFooter {...props}>
                            <View style={{width: "100%", paddingHorizontal: 20, backgroundColor: "white", paddingBottom: 40,}}>
                                <Btn onPress={() => {
                                    setPhase(0);
                                }} styleTxt={{fontWeight: 600,}} text={"Cancel"}/>
                            </View>
                        </BottomSheetFooter>
                    )
                }}
            >
                { phase == 0 ? 
                    <BottomSheetScrollView style={{flex: 1, marginBottom: 100,}} stickyHeaderIndices={[0]}>
                        <View>
                            <View style={{
                                width: windowWidth,
                                alignItems: 'center',
                                paddingHorizontal: 20,
                                paddingVertical: 10,
                                backgroundColor: "white",
                                marginBottom: 10,
                            }}>
                                <Text style={{...defaultStyles.title }}>{title0}</Text>
                                <Text style={{...defaultStyles.subtitle}}>{subtitle0}</Text>
                                <View style={{ width: "100%", borderRadius: 15, borderWidth: 1, marginTop: 15, paddingVertical: 10,}}>
                                    <View style={{height: 18, alignItems: "center", justifyContent: "center",}}>
                                        <BottomSheetTextInput style={{width: "90%", height: "90%", fontSize: 14,}} placeholder='Pickup Location' value={pickupInput} onChangeText={(text) => {setPickupInput(text)}}/>
                                    </View>
                                    <View style={{marginLeft: "5%", width: "90%", borderWidth: 0.3, marginTop: 6,}}></View>
                                    <View style={{height: 18, alignItems: "center", justifyContent: "center", marginTop: 8,}}>
                                        <BottomSheetTextInput style={{width: "90%", height: "90%", fontSize: 14,}} placeholder='Where to?' value={destInput} onChangeText={(text) => {setDestInput(text)}}/>
                                    </View>
                                </View>
                            </View>                  
                        </View>
                        {data.map((item) => {
                            return(
                                <View style={{marginHorizontal: 20, marginTop: 10,height: 50}} key={item.id}>
                                    <TouchableOpacity onPress={() => {
                                        if (!pickupInput) {
                                            setPickupInput(item.address)
                                        } else {
                                            setDestInput(item.address)
                                        }
                                    }} style={{justifyContent: "center", flex: 1,}}>
                                        <Text style={{...defaultStyles.title, fontSize: 14,}}>
                                            {item.location}
                                        </Text>
                                        <Text style={{...defaultStyles.subtitle, fontSize: 14,}}>
                                            {item.address}
                                        </Text>
                                    </TouchableOpacity>
                                    <View style={{width: "100%", borderWidth: 0.3, marginTop: 10,}}></View>
                                </View>
                            )
                        })}
                        <View style={{marginHorizontal: 20, marginBottom: 10, height: 50}}>
                            <TouchableOpacity onPress={() => {
                                bottomSheetRef.current?.snapToIndex(0);
                            }}style={{justifyContent: "center", flex: 1}}>
                                <Text style={{...defaultStyles.title, fontSize: 14,}}>
                                    Set location on map
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </BottomSheetScrollView>  
                :
                    phase == 1 ? 
                        <BottomSheetScrollView style={{flex: 1, marginBottom: 100,}} stickyHeaderIndices={[0]}>
                            <View>
                                <View style={{
                                    width: windowWidth,
                                    alignItems: 'center',
                                    paddingHorizontal: 20,
                                    paddingVertical: 10,
                                    backgroundColor: "white",
                                }}>
                                    <Text style={{...defaultStyles.title}}>{title1}</Text>
                                    <Text style={{...defaultStyles.subtitle}}>{subtitle1}</Text>
                                    <TouchableOpacity onPress={() => {
                                        if (confirmed) {
                                            setPhase(2);
                                            bottomSheetRef.current?.snapToIndex(1);
                                        } else {
                                            bottomSheetRef.current?.snapToIndex(0);
                                            setTitle1("Tap to confirm");
                                            setSubtitle1("Great choice, Nobel!");
                                            setConfirmed(true);
                                        }
                                    }}
                                    style={{...defaultStyles.largeCard, height: 180, width: "100%", marginTop: 20, padding: 20, borderColor: confirmed ? Colors[colorScheme ?? "light"].primary : Colors[colorScheme ?? "light"].borderColor }}>
                                        <View style={{flex: 2, justifyContent: "center", alignItems: "center",}}>
                                            <Text>ICON HERE</Text>
                                        </View>
                                        <View style={{flex: 1, flexDirection: "row"}}>
                                            <View style={{flex: 2}}>
                                                <View style={{flexDirection: "row", gap: 10, alignItems: "center",}}>
                                                    <Text style={{...defaultStyles.title, fontSize: 16}}>{rideTypeData[selected].type}</Text>
                                                    <Text style={{...defaultStyles.title, fontSize: 14}}>{rideTypeData[selected].passengers}</Text>
                                                </View>
                                               <View style={{flexDirection: "row", gap: 10, alignItems: "center",}}>
                                                    <Text style={{...defaultStyles.subtitle, fontSize: 14}}>{rideTypeData[selected].est_time}</Text>
                                                    <Text style={{...defaultStyles.subtitle, fontSize: 14}}>{rideTypeData[selected].away_time} min away</Text>
                                                </View>
                                            </View>
                                            <View style={{flex: 1, alignItems: "flex-end"}}>
                                                <View style={{height: "100%", justifyContent: "center", alignItems: "flex-end",}}>
                                                    <Text style={{...defaultStyles.title, fontSize: 18,}}>{rideTypeData[selected].price_new}</Text>
                                                    <Text style={{...defaultStyles.subtitle, fontSize: 12, textDecorationLine: "line-through"}}>{rideTypeData[selected].price_ori}</Text>
                                                </View>
                                            </View>
                                        </View>
                                    </TouchableOpacity>
                                    <View style={{width:"100%", marginTop: 40,}}>
                                        <Text style={{...defaultStyles.title, fontSize: 16,}}>Or select another ride:</Text>
                                    </View>
                                </View>                  
                            </View>
                            {rideTypeData.map((item) => {
                                if (item.id == selected) return (<View key={item.id}></View>)
                                return (
                                    <View key={item.id}>
                                        <TouchableOpacity onPress={() => {
                                            setSelected(item.id);
                                        }}style={{height: 80, marginHorizontal: 20, marginVertical: 5,}}>
                                            <View style={{flex: 1, flexDirection: "row", padding: 10,}}>
                                                <View style={{flex: 3, justifyContent: "center", alignItems: "center"}}>
                                                    <Text>ICON HERE</Text>
                                                </View>
                                                <View style={{flex: 6, justifyContent: "center", paddingLeft: 10,}}>
                                                    <View style={{flexDirection: "row", gap: 10, alignItems: "center",}}>
                                                        <Text style={{...defaultStyles.title, fontSize: 14}}>{item.type}</Text>
                                                        <Text style={{...defaultStyles.title, fontSize: 12}}>{item.passengers}</Text>
                                                    </View>
                                                    <Text style={{...defaultStyles.title, fontSize: 12, fontWeight: 400,}}>{item.est_time}</Text>
                                                    <Text style={{...defaultStyles.subtitle, fontSize: 12}}>{item.description}</Text>
                                                </View>
                                                <View style={{flex: 2, justifyContent: "center", alignItems: "flex-end"}}>
                                                    <Text style={{...defaultStyles.title, fontSize: 16,}}>{item.price_new}</Text>
                                                    <Text style={{...defaultStyles.subtitle, fontSize: 10, textDecorationLine: "line-through"}}>{item.price_ori}</Text>
                                                </View>
                                            </View>
                                        </TouchableOpacity>
                                    </View>
                                )
                            })}
                        </BottomSheetScrollView>
                    : 
                        phase == 2 ?
                            <BottomSheetScrollView style={{flex: 1, marginBottom: 100,}} stickyHeaderIndices={[0]}>
                                <View style={{
                                    width: windowWidth,
                                    // alignItems: 'center',
                                    paddingHorizontal: 20,
                                    paddingVertical: 10,
                                    // backgroundColor: "red",
                                }}>
                                    <View style={{width: "100%", alignItems: "center", backgroundColor: "white"}}>
                                        <Text style={{...defaultStyles.title}}>Your Jurni ride</Text>
                                        <Text style={{...defaultStyles.subtitle}}>Here's a quick summary.</Text>
                                    </View>
                                </View>
                                <View>
                                    <View  style={{...defaultStyles.mediumCard, marginTop: 10, marginBottom: 25, marginHorizontal: 20, paddingVertical: 10,}}>
                                        <View style={{flex: 1}}>
                                            <View style={{width: "100%", alignItems: "center",}}>
                                                <Text style={{...defaultStyles.title, fontSize: 18,}}>{rideSummaryData[0].name}</Text>
                                            </View>
                                            <View style={{width: "100%", alignItems: "center",}}>
                                                <Text style={{...defaultStyles.title, fontSize: 36,}}>{rideSummaryData[0].value}</Text>
                                            </View>
                                        </View>
                                    </View>
                                </View>
                                <View style={{...defaultStyles.mediumCard, marginHorizontal: 20, padding: 15,}}>
                                    <View style={{width: "100%", alignItems: "center",marginVertical: 5,}}>
                                        <Text style={{...defaultStyles.title, fontSize: 18,}}>Details</Text>
                                    </View>
                                    {rideSummaryData.map((item) => {
                                    if (item.name == "Price") {
                                        return (
                                            <View key={item.name}></View>
                                        )
                                    }
                                    return (
                                        <View key={item.name} style={{paddingVertical: 15}}>
                                            <View style={{flex: 1, flexDirection: "row",}}>
                                                <View style={{flex: 1, justifyContent: "center",}}>
                                                    <Text style={{...defaultStyles.title, fontSize: 14,}}>{item.name}</Text>
                                                </View>
                                                <View style={{flex: 1, alignItems: "flex-end", justifyContent: "center",}}>
                                                    <Text style={{...defaultStyles.subtitle, fontSize: 14,textAlign:"right"}}>{item.value}</Text>
                                                </View>
                                            </View>
                                        </View>
                                    )
                                })}
                                </View>
                            </BottomSheetScrollView>
                        :
                            <BottomSheetView style={{height: windowHeight-265, width: "100%"}}>
                                <View style={{height: 390, width: "100%", justifyContent: "center", alignItems: "center"}}>
                                    <Text>LOADING ANIMATION HERE</Text>
                                </View>
                                <View style={{height: windowHeight-265-390, width: "100%", justifyContent: "center", alignItems: "center", paddingHorizontal: 20,}}>
                                    <Text style={{...defaultStyles.title, fontSize: 14}}>Did you know?</Text>
                                    <Text style={{...defaultStyles.subtitle, fontSize: 12, textAlign: "center",paddingHorizontal: 50, marginTop: 5,}}>Jurni Ride's logo is made up of the location icon and the capital letter J</Text>
                                    <Text></Text>
                                </View>
                            </BottomSheetView>
                }

            </BottomSheetModal>
        </GestureHandlerRootView>
        
    )
}
import { View, Text, useColorScheme, TouchableOpacity } from 'react-native';
import { DrawerActions } from '@react-navigation/native';
import { useNavigation } from 'expo-router';
import MapView, {PROVIDER_GOOGLE} from 'react-native-maps';
import BottomSheetModal, { BottomSheetTextInput, BottomSheetView, BottomSheetScrollView, BottomSheetFooter} from '@gorhom/bottom-sheet';
import StyleDefault from '../../constants/DefaultStyles';
import { useRef, useMemo, useState, useEffect } from 'react';
import * as Location from 'expo-location';
import { Colors } from '../../constants/Colors';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Dimensions } from 'react-native';

import Btn from '../../components/CustomButton';
import { pickupData, destinationData, rideTypeData, rideSummaryData,  } from '../../constants/MockData';

import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome'
import { faLocationDot } from '@fortawesome/free-solid-svg-icons/faLocationDot'
import { faMap } from '@fortawesome/free-solid-svg-icons/faMap'
import { faClock } from '@fortawesome/free-regular-svg-icons/faClock'
import { faStar } from '@fortawesome/free-regular-svg-icons/faStar'
import { faMapPin } from '@fortawesome/free-solid-svg-icons/faMapPin'
import { faUser } from '@fortawesome/free-solid-svg-icons/faUser'
import { faCircle } from '@fortawesome/free-solid-svg-icons/faCircle'
import { faBars } from '@fortawesome/free-solid-svg-icons/faBars'
import { faCar } from '@fortawesome/free-solid-svg-icons/faCar'

export default function MapScreen() {
    const colorScheme = useColorScheme();
    const defaultStyles = StyleDefault({ colorScheme });
    const bottomSheetRef = useRef<BottomSheetModal>(null);
    const snapPoints = useMemo(() =>  [300, "100%"], []);
    const snapPoints1 = useMemo(() => [400, "100%"], []);
    const snapPoints2 = useMemo(() => [390, "100%"], []);
    const snapPoints3 = useMemo(() => [500, "100%"], []);
    const navigation = useNavigation()

    const [location, setLocation] = useState<Location.LocationObject | null>(null);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [result, setResult] = useState<any>(null);
    const [loaded, setLoaded] = useState<Boolean>(false);

    const [btnText, setBtnText] = useState<string>("search destination");
    const [title0, setTitle0] = useState<string>("Set your destination");
    const [subtitle0, setSubtitle0] = useState<string>("Where would you like to go, Nobel?")
    const [pickupInput, setPickupInput] = useState<string>("123 Industrial Park Rd, Springfield");
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
            setBtnText("search pickup")
            setTitle0("Set your pickup")
            setSubtitle0("Where'd you like to meet your driver?")
            setData(pickupData)
        } else if (!destInput) {
            setBtnText("search destination")
            setTitle0("Set your destination")
            setSubtitle0("Where'd you like to go today?")
            setData(destinationData)
        } else {
            setBtnText("confirm details")
            setTitle0("Plan your ride")
            setSubtitle0("Ready for a jurni?")
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
            <TouchableOpacity onPress={() => {navigation.dispatch(DrawerActions.toggleDrawer())}} style={{
                position: "absolute",
                height: 50,
                width: 50,
                borderRadius: 100,
                backgroundColor: Colors[colorScheme ?? "light"].primaryBackground,
                top: 60,
                left: 20,
                zIndex: 1000,
                justifyContent: "center",
                alignItems: "center",
            }}>
                <FontAwesomeIcon icon={faBars} size={20} color={Colors[colorScheme ?? "light"].primary}/>
            </TouchableOpacity>
            {loaded ? <MapView
                initialRegion={{
                    latitude: result.coords.latitude,
                    longitude: result.coords.longitude,
                    latitudeDelta: 0.005,
                    longitudeDelta: 0.005,
                }}
                provider={PROVIDER_GOOGLE}
                showsIndoors={false}
                showsUserLocation={true}
                style={{
                    flex: 1,
                }}
            />
            :
            <View style={{flex: 1, backgroundColor: Colors[colorScheme ?? "light"].primaryBackground,}}>
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
                backgroundStyle={{backgroundColor: Colors[colorScheme ?? "light"].primaryBackground}}
                handleIndicatorStyle={{backgroundColor: Colors[colorScheme ?? "light"].primaryText}}
                keyboardBehavior="interactive"
                snapPoints={ phase == 0 ? snapPoints : phase == 1 ? snapPoints1 : phase == 2 ? snapPoints2 : snapPoints3}
                enableDynamicSizing={false}
                keyboardBlurBehavior='restore'
                topInset={150}
                footerComponent={(props) => {
                    if (phase == 0) {
                        return (
                            <BottomSheetFooter {...props}>
                                <View style={{
                                    width: "100%", 
                                    paddingHorizontal: 20, 
                                    backgroundColor: Colors[colorScheme ?? "light"].primaryBackground, 
                                    paddingBottom: 40,}}>
                                    <Btn styleBtn={{}} text={btnText} onPress={() => {
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
                                <View style={{
                                    width: "100%", 
                                    paddingHorizontal: 20, 
                                    backgroundColor: Colors[colorScheme ?? "light"].primaryBackground, 
                                    paddingBottom: 40,}}>
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
                                    }} text={confirmed ? "cancel" : "return"}/>
                                </View>
                            </BottomSheetFooter>
                        )
                    } else if (phase == 2) {
                        return (
                            <BottomSheetFooter {...props}>
                                <View style={{
                                    width: "100%", 
                                    paddingHorizontal: 20, 
                                    backgroundColor: Colors[colorScheme ?? "light"].primaryBackground, 
                                    paddingBottom: 40, 
                                    gap: 10,}}>
                                    <Btn onPress={() => {
                                        setPhase(3);
                                        bottomSheetRef.current?.snapToIndex(0);
                                    }} text="request ride"/>
                                    <Btn onPress={() => {setPhase(1)}} styleTxt={{color: Colors[colorScheme ?? "light"].primary,}} styleBtn={{
                                        borderWidth: 1,
                                        borderColor: Colors[colorScheme ?? "light"].primary,
                                        backgroundColor: Colors[colorScheme ?? "light"].primaryBackground,
                                    }} text="return"/>
                                </View>
                            </BottomSheetFooter>
                        )
                    }
                    return (
                        <BottomSheetFooter {...props}>
                            <View style={{width: "100%", paddingHorizontal: 20, backgroundColor: Colors[colorScheme ?? "light"].primaryBackground, paddingBottom: 40,}}>
                                <Btn onPress={() => {
                                    setPhase(0);
                                }} text={"cancel"}/>
                            </View>
                        </BottomSheetFooter>
                    )
                }}
            >
                { phase == 0 ? 
                    <BottomSheetScrollView style={{
                        flex: 1, 
                        marginBottom: 100, 
                        backgroundColor: Colors[colorScheme ?? "light"].primaryBackground
                    }} 
                    stickyHeaderIndices={[0]}
                    >
                        <View>
                            <View style={{
                                width: windowWidth,
                                alignItems: 'center',
                                paddingHorizontal: 20,
                                paddingVertical: 10,
                                backgroundColor: Colors[colorScheme ?? "light"].primaryBackground,
                                marginBottom: 10,
                            }}>
                                <Text style={defaultStyles.title}>{title0}</Text>
                                <Text style={defaultStyles.subtitle}>{subtitle0}</Text>
                                <View style={{ 
                                    width: "100%", 
                                    borderRadius: 15, 
                                    borderWidth: 1, 
                                    marginTop: 15, 
                                    paddingVertical: 10, 
                                    borderColor: Colors[colorScheme ?? "light"].borderColor
                                }}>
                                    <View style={{
                                        height: 20, 
                                        alignItems: "center", 
                                        justifyContent: "center", 
                                        flexDirection: "row", 
                                        gap: 12
                                    }}>
                                        <FontAwesomeIcon 
                                            icon={faLocationDot} 
                                            size={16} 
                                            color={Colors[colorScheme ?? "light"].primaryText}
                                        />
                                        <BottomSheetTextInput style={{
                                            width: "80%", 
                                            height: "100%", 
                                            fontSize: 16,
                                            color: Colors[colorScheme ?? "light"].primaryText, 
                                            fontFamily:'Outfit_400Regular'
                                        }} 
                                        placeholderTextColor={Colors[colorScheme ?? "light"].secondary} 
                                        placeholder='Pickup Location' 
                                        value={pickupInput} 
                                        onChangeText={(text) => {setPickupInput(text)}}
                                        />
                                    </View>
                                    <View style={{
                                        marginLeft: (windowWidth-40)*0.05+30, 
                                        width: (windowWidth-40)*0.9-30, 
                                        borderWidth: 0.3, 
                                        marginTop: 6, 
                                        borderColor: Colors[colorScheme ?? "light"].primaryText
                                    }}></View>
                                    <View style={{
                                        height: 20, 
                                        alignItems: "center", 
                                        justifyContent: "center", 
                                        marginTop: 8, 
                                        flexDirection: "row", 
                                        gap: 12,
                                    }}>
                                        <FontAwesomeIcon 
                                            icon={faMap} 
                                            size={16} 
                                            color={Colors[colorScheme ?? "light"].primaryText}
                                        />
                                        <BottomSheetTextInput style={{
                                            width: "80%", 
                                            height: "100%", 
                                            fontSize: 16, color: 
                                            Colors[colorScheme ?? "light"].primaryText, 
                                            fontFamily:'Outfit_400Regular'
                                        }} 
                                        placeholderTextColor={Colors[colorScheme ?? "light"].secondary} 
                                        placeholder='Where to?' 
                                        value={destInput} 
                                        onChangeText={(text) => {setDestInput(text)}}
                                        />
                                    </View>
                                </View>
                            </View>                  
                        </View>
                        {data.map((item) => {
                            return(
                                <View style={{
                                    marginHorizontal: 20, 
                                    marginTop: 12,
                                    height: 54
                                }} 
                                key={item.id}
                                >
                                    <TouchableOpacity onPress={() => {
                                        if (!pickupInput) {
                                            setPickupInput(item.address)
                                        } else {
                                            setDestInput(item.address)
                                        }
                                    }} style={{
                                        alignItems: "center", 
                                        flex: 1, 
                                        flexDirection: "row", 
                                        gap: 15,
                                    }}
                                    >
                                        <View style={{
                                            height: 30, 
                                            width: 30, 
                                            borderRadius: "100%", 
                                            justifyContent: "center", 
                                            alignItems: "center"
                                        }}
                                        >
                                            <FontAwesomeIcon 
                                                icon={faClock} 
                                                size={15} 
                                                color={Colors[colorScheme ?? "light"].primaryText}
                                            />
                                        </View>
                                
                                        <View style={{ height: "100%", }}>
                                            <Text style={{
                                                ...defaultStyles.title, 
                                                fontSize: 14,
                                            }}
                                            >
                                                {item.location}
                                            </Text>
                                            <Text style={{
                                                ...defaultStyles.subtitle, 
                                                fontSize: 14,
                                            }}
                                            >
                                                {item.address}
                                            </Text>
                                        </View>
                                    </TouchableOpacity>
                                    <View style={{
                                        marginLeft: 45, 
                                        width: windowWidth-85, 
                                        borderWidth: 0.3, 
                                        marginTop: 12, 
                                        borderColor: Colors[colorScheme ?? "light"].secondary
                                    }}
                                    ></View>
                                </View>
                            )
                        })}
                        <View style={{
                            marginHorizontal: 20, 
                            height: 60
                        }}
                        >
                            <TouchableOpacity onPress={() => {
                                bottomSheetRef.current?.snapToIndex(0);
                            }}
                            style={{
                                alignItems: "center", 
                                flex: 1, 
                                flexDirection: "row", 
                                gap: 15,
                            }}
                            >
                                <View style={{
                                    height: 30, 
                                    width: 30, 
                                    borderRadius: "100%", 
                                    backgroundColor: Colors[colorScheme ?? "light"].secondaryBackground, 
                                    justifyContent: "center", alignItems: "center"
                                }}
                                >
                                    <FontAwesomeIcon 
                                        icon={faMapPin} 
                                        size={15} 
                                        color={Colors[colorScheme ?? "light"].primaryText}
                                    />
                                </View>
                                <Text style={{
                                    ...defaultStyles.title, 
                                    fontSize: 14,
                                }}
                                >
                                    Set location on map
                                </Text>
                            </TouchableOpacity>
                        </View>
                        <View style={{
                            marginLeft: 65, 
                            width: windowWidth-85, 
                            borderWidth: 0.3, 
                            borderColor: Colors[colorScheme ?? "light"].secondary
                        }}
                        ></View>
                        <View style={{
                            marginHorizontal: 20, 
                            height: 60
                        }}
                        >
                            <TouchableOpacity onPress={() => {
                                bottomSheetRef.current?.snapToIndex(0);
                            }}
                            style={{
                                alignItems: "center", 
                                flex: 1, 
                                flexDirection: "row", 
                                gap: 15,
                            }}
                            >
                                <View style={{
                                    height: 30, 
                                    width: 30, 
                                    borderRadius: "100%", 
                                    backgroundColor: Colors[colorScheme ?? "light"].secondaryBackground, 
                                    justifyContent: "center", alignItems: "center"
                                }}
                                >
                                    <FontAwesomeIcon 
                                        icon={faStar} 
                                        size={15} 
                                        color={Colors[colorScheme ?? "light"].primaryText}
                                    />
                                </View>
                                <Text style={{
                                    ...defaultStyles.title, 
                                    fontSize: 14,
                                }}
                                >
                                    Saved places
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </BottomSheetScrollView>  
                :
                    phase == 1 ? 
                        <BottomSheetScrollView style={{
                            flex: 1, 
                            marginBottom: 100, 
                            backgroundColor: Colors[colorScheme ?? "light"].primaryBackground
                        }} 
                        stickyHeaderIndices={[0]}
                        >
                            <View>
                                <View style={{
                                    width: windowWidth,
                                    alignItems: 'center',
                                    paddingHorizontal: 20,
                                    paddingVertical: 10,
                                    backgroundColor: Colors[colorScheme ?? "light"].primaryBackground,
                                }}>
                                    <Text style={defaultStyles.title}>{title1}</Text>
                                    <Text style={defaultStyles.subtitle}>{subtitle1}</Text>
                                    <TouchableOpacity onPress={() => {
                                        if (confirmed) {
                                            setPhase(2);
                                            setTitle1("Tap to select");
                                            setSubtitle1("You've got options.");
                                            setConfirmed(false);
                                            bottomSheetRef.current?.snapToIndex(1);
                                        } else {
                                            bottomSheetRef.current?.snapToIndex(0);
                                            setTitle1("Tap to confirm");
                                            setSubtitle1("Great choice, Nobel!");
                                            setConfirmed(true);
                                        }
                                    }}
                                    style={{
                                        ...defaultStyles.largeCard, 
                                        height: 180, 
                                        width: "100%", 
                                        marginTop: 20, 
                                        padding: 20, 
                                        borderColor: confirmed ? Colors[colorScheme ?? "light"].primary : Colors[colorScheme ?? "light"].borderColor, 
                                        backgroundColor: confirmed ? Colors[colorScheme ?? "light"].secondaryBackground : Colors[colorScheme ?? "light"].primaryBackground
                                    }}
                                    >
                                        <View style={{
                                            flex: 2, 
                                            justifyContent: "center", 
                                            alignItems: "center",
                                        }}
                                        >
                                            <FontAwesomeIcon 
                                                icon={rideTypeData[selected].icon} 
                                                size={100} 
                                                color={Colors[colorScheme ?? "light"].primary}
                                            />
                                        </View>
                                        <View style={{ 
                                            flex: 1, 
                                            flexDirection: "row" 
                                        }}
                                        >
                                            <View style={{ flex: 2 }}>
                                                <View style={{
                                                    flexDirection: "row", 
                                                    gap: 10, 
                                                    alignItems: "center",
                                                }}
                                                >
                                                    <Text style={{
                                                        ...defaultStyles.title, 
                                                        fontSize: 16
                                                    }}
                                                    >
                                                        {rideTypeData[selected].type}
                                                    </Text>
                                                    <View style={{
                                                        flexDirection: "row", 
                                                        gap: 2, 
                                                        justifyContent: "center", 
                                                        alignItems: "center"
                                                    }}
                                                    >
                                                        <FontAwesomeIcon 
                                                            icon={faUser} 
                                                            size={12} 
                                                            color={Colors[colorScheme ?? "light"].primaryText} 
                                                        />
                                                        <Text style={{
                                                            ...defaultStyles.title, 
                                                            fontSize: 14
                                                        }}
                                                        >
                                                            {rideTypeData[selected].passengers}
                                                        </Text>
                                                    </View>
                                                </View>
                                               <View style={{
                                                    flexDirection: "row", 
                                                    gap: 6, 
                                                    alignItems: "center",
                                                }}
                                                >
                                                    <Text style={{
                                                        ...defaultStyles.subtitle, 
                                                        fontSize: 14
                                                    }}
                                                    >
                                                        {rideTypeData[selected].est_time}
                                                    </Text>
                                                    <FontAwesomeIcon 
                                                        icon={faCircle} 
                                                        size={4} 
                                                        color={Colors[colorScheme ?? "light"].secondaryText} 
                                                    />
                                                    <Text style={{
                                                        ...defaultStyles.subtitle, 
                                                        fontSize: 14
                                                    }}
                                                    >
                                                        {rideTypeData[selected].away_time} min away
                                                    </Text>
                                                </View>
                                            </View>
                                            <View style={{
                                                flex: 1, 
                                                alignItems: "flex-end"
                                            }}
                                            >
                                                <View style={{
                                                    height: "100%", 
                                                    justifyContent: "center", 
                                                    alignItems: "flex-end",
                                                }}
                                                >
                                                    <Text style={{
                                                        ...defaultStyles.title, 
                                                        fontSize: 18,
                                                    }}
                                                    >
                                                        {rideTypeData[selected].price_new}
                                                    </Text>
                                                    <Text style={{
                                                        ...defaultStyles.subtitle, 
                                                        fontSize: 12, 
                                                        textDecorationLine: "line-through"
                                                    }}
                                                    >
                                                        {rideTypeData[selected].price_ori}
                                                    </Text>
                                                </View>
                                            </View>
                                        </View>
                                    </TouchableOpacity>
                                    <View style={{
                                        width:"100%", 
                                        marginTop: 40,
                                    }}
                                    >
                                        <Text style={{
                                            ...defaultStyles.title, 
                                            fontSize: 16,
                                        }}
                                        >
                                            Or select another ride:
                                        </Text>
                                    </View>
                                </View>                  
                            </View>
                            {rideTypeData.map((item) => {
                                if (item.id == selected) return (<View key={item.id}></View>)
                                return (
                                    <View key={item.id}>
                                        <TouchableOpacity onPress={() => {
                                            setSelected(item.id);
                                        }}style={{
                                            height: 80, 
                                            marginHorizontal: 20, 
                                            marginVertical: 5,
                                        }}
                                        >
                                            <View style={{
                                                flex: 1, 
                                                flexDirection: "row", 
                                                padding: 10,
                                            }}
                                            >
                                                <View style={{
                                                    flex: 3, 
                                                    justifyContent: "center", 
                                                    alignItems: "center"
                                                }}
                                                >
                                                    <FontAwesomeIcon 
                                                        icon={item.icon} 
                                                        size={40} 
                                                        color={Colors[colorScheme ?? "light"].primary}
                                                    />
                                                </View>
                                                <View style={{
                                                    flex: 6, 
                                                    justifyContent: "center", 
                                                    paddingLeft: 10,
                                                }}
                                                >
                                                    <View style={{
                                                        flexDirection: "row", 
                                                        gap: 8, 
                                                        alignItems: "center",
                                                    }}
                                                    >
                                                        <Text style={{
                                                            ...defaultStyles.title, 
                                                            fontSize: 14
                                                        }}
                                                        >
                                                            {item.type}
                                                        </Text>
                                                        <View style={{
                                                            flexDirection: "row", 
                                                            gap: 2, 
                                                            justifyContent: "center", 
                                                            alignItems: "center"
                                                        }}
                                                        >
                                                            <FontAwesomeIcon 
                                                                icon={faUser} 
                                                                size={10} 
                                                                color={Colors[colorScheme ?? "light"].primaryText} 
                                                            />
                                                            <Text style={{
                                                                ...defaultStyles.title, 
                                                                fontSize: 12
                                                            }}
                                                            >
                                                                {item.passengers}
                                                            </Text>
                                                        </View>
                                                    </View>
                                                    <Text style={{
                                                        ...defaultStyles.title, 
                                                        fontSize: 12, 
                                                        fontWeight: 400,
                                                    }}>
                                                        {item.est_time}
                                                    </Text>
                                                    <Text style={{
                                                        ...defaultStyles.subtitle, 
                                                        fontSize: 12
                                                    }}
                                                    >
                                                        {item.description}
                                                    </Text>
                                                </View>
                                                <View style={{
                                                    flex: 2, 
                                                    justifyContent: "center", 
                                                    alignItems: "flex-end"
                                                }}
                                                >
                                                    <Text style={{
                                                        ...defaultStyles.title, 
                                                        fontSize: 16,
                                                    }}
                                                    >
                                                        {item.price_new}
                                                    </Text>
                                                    <Text style={{
                                                        ...defaultStyles.subtitle, 
                                                        fontSize: 10, 
                                                        textDecorationLine: "line-through"
                                                    }}
                                                    >
                                                        {item.price_ori}
                                                    </Text>
                                                </View>
                                            </View>
                                        </TouchableOpacity>
                                    </View>
                                )
                            })}
                        </BottomSheetScrollView>
                    : 
                        phase == 2 ?
                            <BottomSheetScrollView style={{
                                flex: 1, 
                                marginBottom: 100, 
                                backgroundColor: Colors[colorScheme ?? "light"].primaryBackground
                            }} 
                            stickyHeaderIndices={[0]}
                            >
                                <View style={{
                                    width: windowWidth,
                                    paddingHorizontal: 20,
                                    paddingVertical: 10,
                                    backgroundColor: Colors[colorScheme ?? "light"].primaryBackground
                                }}>
                                    <View style={{width: "100%", alignItems: "center"}}>
                                        <Text style={defaultStyles.title}>Your jurni ride</Text>
                                        <Text style={defaultStyles.subtitle}>Here's a quick summary.</Text>
                                    </View>
                                </View>
                                <View>
                                    <View style={{
                                        ...defaultStyles.mediumCard, 
                                        marginTop: 14, 
                                        marginBottom: 20, 
                                        marginHorizontal: 20, 
                                        paddingVertical: 10,
                                    }}
                                    >
                                        <View style={{flex: 1}}>
                                            <View style={{
                                                width: "100%", 
                                                alignItems: "center",
                                            }}
                                            >
                                                <Text style={{
                                                    ...defaultStyles.title, 
                                                    fontSize: 18,
                                                }}
                                                >
                                                    {rideSummaryData[0].name}
                                                </Text>
                                            </View>
                                            <View style={{
                                                width: "100%", 
                                                alignItems: "center",
                                            }}
                                            >
                                                <Text style={{
                                                    ...defaultStyles.title, 
                                                    fontSize: 36, 
                                                    color: Colors[colorScheme ?? "light"].secondaryText
                                                }}
                                                >
                                                    {rideSummaryData[0].value}
                                                </Text>
                                            </View>
                                        </View>
                                    </View>
                                </View>
                                <View style={{
                                    ...defaultStyles.mediumCard, 
                                    marginHorizontal: 20, 
                                    padding: 12,
                                }}
                                >
                                    <View style={{
                                        width: "100%", 
                                        alignItems: "center",
                                        marginVertical: 5,
                                    }}
                                    >
                                        <Text style={{
                                            ...defaultStyles.title, 
                                            fontSize: 18,
                                        }}
                                        >
                                            Details
                                        </Text>
                                    </View>
                                    {rideSummaryData.map((item) => {
                                        if (item.name == "Price") {
                                            return (
                                                <View key={item.name}></View>
                                            )
                                        }
                                        return (
                                            <View key={item.name} style={{paddingVertical: 15}}>
                                                <View style={{
                                                    flex: 1, 
                                                    flexDirection: "row",
                                                }}
                                                >
                                                    <View style={{
                                                        flex: 1, 
                                                        justifyContent: "center",
                                                    }}
                                                    >
                                                        <Text style={{
                                                            ...defaultStyles.title, 
                                                            fontSize: 14,
                                                        }}
                                                        >
                                                            {item.name}
                                                        </Text>
                                                    </View>
                                                    <View style={{
                                                        flex: 1, 
                                                        alignItems: "flex-end", 
                                                        justifyContent: "center",
                                                    }}
                                                    >
                                                        <Text style={{
                                                            ...defaultStyles.subtitle, 
                                                            fontSize: 14,
                                                            textAlign:"right"
                                                        }}
                                                        >
                                                            {item.value}
                                                        </Text>
                                                    </View>
                                                </View>
                                            </View>
                                        )
                                    })}
                                </View>
                                <View style={{height: 100, }}></View>
                            </BottomSheetScrollView>
                        :
                            <BottomSheetView style={{
                                height: windowHeight-265, 
                                width: "100%", 
                                backgroundColor: Colors[colorScheme ?? "light"].primaryBackground
                            }}
                            >
                                <View style={{
                                    height: 390, 
                                    width: "100%", 
                                    justifyContent: "center", 
                                    alignItems: "center"
                                }}
                                >
                                    <View style={{
                                        height: 300, 
                                        width: 300, 
                                        backgroundColor: Colors[colorScheme ?? "light"].secondaryBackground, 
                                        justifyContent: "center", 
                                        alignItems: "center", 
                                        borderRadius: 50,
                                    }}
                                    >
                                        <FontAwesomeIcon 
                                            icon={faCar} 
                                            size={100} 
                                            color={Colors[colorScheme ?? "light"].primary} 
                                        />
                                        <Text style={{
                                            ...defaultStyles.title, 
                                            fontSize: 16, 
                                            color: Colors[colorScheme ?? "light"].secondaryText, 
                                            marginTop: 30,
                                        }}
                                        >
                                            Finding a ride...
                                        </Text>
                                    </View>
                                </View>
                                <View style={{
                                    height: windowHeight-265-390, 
                                    width: "100%", 
                                    justifyContent: "center", 
                                    alignItems: "center", 
                                    paddingHorizontal: 20,
                                }}
                                >
                                    <Text style={{
                                        ...defaultStyles.title, 
                                        fontSize: 14
                                    }}
                                    >
                                        Did you know?
                                    </Text>
                                    <Text style={{
                                        ...defaultStyles.subtitle, 
                                        fontSize: 12, 
                                        textAlign: "center",
                                        paddingHorizontal: 50, 
                                        marginTop: 5,
                                    }}
                                    >
                                        jurni's logo is made up of the location icon and the capital letter J
                                    </Text>
                                    <Text></Text>
                                </View>
                            </BottomSheetView>
                }
            </BottomSheetModal>
        </GestureHandlerRootView>
    )
}
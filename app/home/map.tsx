import { View, Text, useColorScheme, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DrawerToggleButton } from '@react-navigation/drawer';
import MapView from 'react-native-maps';
import BottomSheetModal, { BottomSheetView } from '@gorhom/bottom-sheet';
import StyleDefault from '../../constants/DefaultStyles';
import { useRef, useCallback, useMemo, useState, useEffect } from 'react';
import * as Location from 'expo-location';
import { Colors } from '../../constants/Colors';

export default function MapScreen() {
    const colorScheme = useColorScheme();
    const defaultStyles = StyleDefault({ colorScheme });
    
    const bottomSheetRef = useRef<BottomSheetModal>(null);
    const snapPoints = useMemo(() =>  ["85%"], []);

    const [location, setLocation] = useState<Location.LocationObject | null>(null);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [result, setResult] = useState<any>(null);
    const [loaded, setLoaded] = useState<Boolean>(false);
    const [pulled, setPulled] = useState<Boolean>(false);

    // callbacks
    const handleSheetChanges = useCallback((index: number) => {
        console.log(index, index == 1);
        setPulled(index == 1);
        console.log(pulled);
    }, []);


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
        if (location && !result) {
            setResult(JSON.parse(JSON.stringify(location)));
            setLoaded(true);
        }
    }, [location]) 

    return (
        <View style={styles.container}>
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
                    Map not loaded
                </Text>
            </View>
            }
            
            
            
            <BottomSheetModal
                ref={bottomSheetRef}
                onChange={handleSheetChanges}
                snapPoints={snapPoints}
            >
                {pulled ? 
                    <BottomSheetView style={styles.contentContainer}>
                        <Text style={{fontSize: 20, fontWeight: 600, color: Colors[colorScheme ?? "light"].text}}>Plan your ride</Text>
                    </BottomSheetView>                  
                :
                    <BottomSheetView style={styles.contentContainer}>
                        <Text style={{fontSize: 20, fontWeight: 600, color: Colors[colorScheme ?? "light"].text}}>Set your destination</Text>
                    </BottomSheetView>   
                }

            </BottomSheetModal>
        </View>
        
    )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    flex: 1,
    height: 250,
    alignItems: 'center',
    padding: 20,
  },
});
import React from "react";
import { Dimensions, useColorScheme, View } from "react-native";
import FloatingPin from "./FloatingPin";

interface CrosshairOverlayProps {
    ref: React.RefObject<View | null>
    moving: boolean;
}

export default function CrosshairOverlay({ ref, moving }: CrosshairOverlayProps) {
    const windowWidth = Dimensions.get('window').width;
    const windowHeight = Dimensions.get('window').height;
    const colorScheme = useColorScheme();

    return (
        <View
            pointerEvents="none"
            style={{
                width: 2 * 10 + 1,
                height: 2 * 10 + 1,
                zIndex: 1000,
                position: "absolute",
                top: (windowHeight-21-260)/2,
                left: (windowWidth-21)/2,
                justifyContent: "center",
                alignItems: "center",
            }}
            ref={ref}
        >
            <View
                style={{
                    transform: [{ translateY: -10 }],
                }}
            >
                <FloatingPin isDragging={!!moving} />
            </View>
        </View>
    );
}
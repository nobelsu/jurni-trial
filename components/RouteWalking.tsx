import { useMemo } from "react";
import { Position } from "../lib/mapbox";
import { LineLayer, ShapeSource } from "@rnmapbox/maps";
import { Colors } from "../constants/Colors";
import { useColorScheme } from "react-native";

interface RouteWalkingProps {
    coordinates: Position[]
}

export default function RouteWalking ({ coordinates } : RouteWalkingProps) {
  const colorScheme = useColorScheme()
  const themeKey: keyof typeof Colors = colorScheme === "dark" ? "dark" : "light";

  const features: GeoJSON.FeatureCollection = useMemo(() => {
    return {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          id: 'a-feature',
          geometry: {
            type: 'LineString',
            coordinates,
          },
          properties: {},
        } as const,
      ],
    };
  }, [coordinates]);
  return (
    <ShapeSource id={'route-walking-shape-source'} shape={features}>
      <LineLayer id={'route-walking-line-layer'} style={{lineColor: Colors[themeKey].text, lineWidth: 2 , lineCap: "round", lineDasharray: [0, 2]}} />
    </ShapeSource>
  );
};
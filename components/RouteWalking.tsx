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

  // #region agent log
  fetch('http://127.0.0.1:7892/ingest/fb625c74-31ba-4592-9644-25e01b78d2b3', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Debug-Session-Id': '4e9209',
    },
    body: JSON.stringify({
      sessionId: '4e9209',
      runId: 'initial',
      hypothesisId: 'H3',
      location: 'components/RouteWalking.tsx:31',
      message: 'RouteWalking LineLayer render',
      data: { coordCount: coordinates.length },
      timestamp: Date.now(),
    }),
  }).catch(() => {});
  // #endregion

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
      <LineLayer id={'route-walking-line-layer'} style={{lineColor: Colors[colorScheme ?? "light"].text, lineWidth: 2 , lineCap: "round", lineDasharray: [0, 2]}} />
    </ShapeSource>
  );
};
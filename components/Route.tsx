import { useMemo } from "react";
import { Position } from "../lib/mapbox";
import { LineLayer, ShapeSource } from "@rnmapbox/maps";
import { Colors } from "../constants/Colors";
import { useColorScheme } from "react-native";

interface RouteProps {
    coordinates: Position[]
}

function hexToRgba(hex: string, alpha: number): string {
  const normalized = hex.replace("#", "");

  if (normalized.length === 3) {
    const r = parseInt(normalized[0] + normalized[0], 16);
    const g = parseInt(normalized[1] + normalized[1], 16);
    const b = parseInt(normalized[2] + normalized[2], 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  if (normalized.length === 6) {
    const r = parseInt(normalized.slice(0, 2), 16);
    const g = parseInt(normalized.slice(2, 4), 16);
    const b = parseInt(normalized.slice(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  return hex;
}

export default function Route ({ coordinates } : RouteProps) {
  const colorScheme = useColorScheme()
  const themeKey: keyof typeof Colors = colorScheme === "dark" ? "dark" : "light";
  const animationProgress = 0.5;

  const baseColor = useMemo(
    () => hexToRgba(Colors[themeKey].primary, 0.15),
    [colorScheme],
  );

  const pulseColor = useMemo(
    () => hexToRgba(Colors[themeKey].primary, 1),
    [colorScheme],
  );

  const transparentColor = useMemo(
    () => hexToRgba(Colors[themeKey].primary, 0),
    [colorScheme],
  );

  const lineGradient = useMemo(() => {
    const windowWidth = 0.15;

    // Use distance from the animated center, so interpolate inputs (0, windowWidth)
    // are always in strictly ascending order, independent of animationProgress.
    return [
      "interpolate",
      ["linear"],
      [
        "abs",
        [
          "-",
          ["line-progress"],
          animationProgress,
        ],
      ],
      0,
      pulseColor,
      windowWidth,
      transparentColor,
    ] as any;
  }, [animationProgress, pulseColor, transparentColor]);

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

  if (!coordinates || coordinates.length < 2) {
    return null;
  }

  return (
    <ShapeSource
      id={'route-shape-source'}
      shape={features}
      // Enable lineMetrics on the source so line-progress works for gradients.
      lineMetrics
    >
      <LineLayer
        id={'route-line-layer-base'}
        style={{
          lineColor: baseColor,
          lineWidth: 4,
          lineCap: "round",
          lineJoin: "round",
        }}
      />
      <LineLayer
        id={'route-line-layer-animated'}
        style={{
          lineWidth: 4,
          lineCap: "round",
          lineJoin: "round",
          lineGradient,
        }}
      />
    </ShapeSource>
  );
};
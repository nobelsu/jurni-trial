import { useEffect, useMemo, useState } from "react";
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

  const [animationProgress, setAnimationProgress] = useState(0);

  useEffect(() => {
    if (!coordinates || coordinates.length < 2) return;

    let frameId: number;
    const durationMs = 2000;
    const startTime = Date.now();

    const loop = () => {
      const elapsed = (Date.now() - startTime) % durationMs;
      const progress = elapsed / durationMs;
      setAnimationProgress(progress);
      frameId = requestAnimationFrame(loop);
    };

    frameId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(frameId);
    };
  }, [coordinates]);

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
      hypothesisId: 'H2',
      location: 'components/Route.tsx:31',
      message: 'Route LineLayer render',
      data: { coordCount: coordinates.length },
      timestamp: Date.now(),
    }),
  }).catch(() => {});
  // #endregion

  const baseColor = useMemo(
    () => hexToRgba(Colors[colorScheme ?? "light"].primary, 0.15),
    [colorScheme],
  );

  const pulseColor = useMemo(
    () => hexToRgba(Colors[colorScheme ?? "light"].primary, 1),
    [colorScheme],
  );

  const transparentColor = useMemo(
    () => hexToRgba(Colors[colorScheme ?? "light"].primary, 0),
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
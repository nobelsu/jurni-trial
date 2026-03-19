import axios from "axios"

export type Position = [number, number]

export const MAPBOX_ACCESS_TOKEN = process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN;
export const  MAP_SIZE = 240;

export type DrivingDirectionsResult =
    | {
        kind: "ok";
        coordinates: Position[];
        distance: number;
        duration: number;
      }
    | {
        kind: "no_route";
      };

export async function obtainDirections(pickupCoords: Position, destCoords: Position): Promise<DrivingDirectionsResult> {
    if (!pickupCoords || !destCoords) {
        throw new Error("Coordinates invalid!");
    }

    const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${pickupCoords[0]},${pickupCoords[1]};${destCoords[0]},${destCoords[1]}`
    const res = await axios.get(url, {
        params: {
            access_token: MAPBOX_ACCESS_TOKEN,
            alternatives: true,
            geometries: "geojson",
            overview: "full",
            steps: true
        }
    })

    const routes = Array.isArray(res.data?.routes) ? res.data.routes : [];
    const first = routes[0];

    if (
        !first ||
        !first.geometry ||
        !Array.isArray(first.geometry.coordinates) ||
        first.geometry.coordinates.length === 0
    ) {
        return { kind: "no_route" };
    }

    return {
        kind: "ok",
        coordinates: first.geometry.coordinates as Position[],
        distance: typeof first.distance === "number" ? first.distance / 1000 : 0,
        duration: typeof first.duration === "number" ? first.duration / 60 : 0,
    }
}

export interface SearchResult {
    id: string;
    name: string;
    full_address: string;
    coords: Position;
}

export interface PlaceLabel {
    name: string;
    full_address: string;
}

export async function searchPlaces(query: string, proximity?: Position): Promise<SearchResult[]> {
    if (!query.trim()) return [];
    const sessionToken = Math.random().toString(36).slice(2);
    const suggestUrl = "https://api.mapbox.com/search/searchbox/v1/suggest";
    const res = await axios.get(suggestUrl, {
        params: {
            q: query,
            access_token: MAPBOX_ACCESS_TOKEN,
            limit: 6,
            session_token: sessionToken,
            ...(proximity ? { proximity: `${proximity[0]},${proximity[1]}` } : {}),
        },
    });
    const suggestions = (res.data?.suggestions ?? []) as any[];

    const detailedResults = await Promise.all(
        suggestions.map(async (s: any) => {
            const mapboxId = s?.mapbox_id ?? s?.id;
            if (!mapboxId) return null;

            try {
                const retrieveUrl = `https://api.mapbox.com/search/searchbox/v1/retrieve/${encodeURIComponent(
                    mapboxId
                )}`;
                const retrieveRes = await axios.get(retrieveUrl, {
                    params: {
                        access_token: MAPBOX_ACCESS_TOKEN,
                        session_token: sessionToken,
                    },
                });
                const feature = retrieveRes.data?.features?.[0];
                if (!feature) {
                    return null;
                }

                let lngLat: Position | null = null;

                const center = feature.center;
                if (center && typeof center.longitude === "number" && typeof center.latitude === "number") {
                    lngLat = [center.longitude, center.latitude];
                } else if (
                    feature.geometry &&
                    Array.isArray(feature.geometry.coordinates) &&
                    typeof feature.geometry.coordinates[0] === "number" &&
                    typeof feature.geometry.coordinates[1] === "number"
                ) {
                    lngLat = [feature.geometry.coordinates[0], feature.geometry.coordinates[1]];
                }

                if (!lngLat) {
                    return null;
                }
                return {
                    id: mapboxId,
                    name: s.name ?? feature.properties?.name ?? feature.place_name,
                    full_address: s.place_formatted ?? feature.place_name ?? "",
                    coords: lngLat,
                } as SearchResult;
            } catch {
                return null;
            }
        })
    );

    return detailedResults.filter((r): r is SearchResult => r !== null);
}

export async function getPlaceLabelForCoords(coords: Position): Promise<PlaceLabel | null> {
    if (!coords || typeof coords[0] !== "number" || typeof coords[1] !== "number") {
        return null;
    }

    try {
        const url = "https://api.mapbox.com/search/searchbox/v1/reverse";
        const res = await axios.get(url, {
            params: {
                access_token: MAPBOX_ACCESS_TOKEN,
                longitude: coords[0],
                latitude: coords[1],
            },
        });

        const features: any[] = Array.isArray(res.data?.features) ? res.data.features : [];
        if (!features.length) {
            return null;
        }

        // Prefer the first POI feature; fall back to the first feature.
        const poiFeature = features.find(
            (f: any) => f?.properties?.feature_type === "poi"
        );
        const feature = poiFeature ?? features[0];

        const properties = feature.properties ?? {};
        const context = (properties as any).context ?? {};
        const featureType: string | undefined = (properties as any).feature_type;

        // Prefer a human-friendly label:
        // - For POIs: use the POI name.
        // - For addresses/other types: use the formatted/full address first.
        let name: string;
        if (featureType === "poi") {
            name =
                properties.name ||
                properties.full_address ||
                properties.place_formatted ||
                properties.address ||
                "";
        } else {
            name =
                properties.full_address ||
                properties.place_formatted ||
                properties.address ||
                (context.neighborhood?.name as string | undefined) ||
                (context.place?.name as string | undefined) ||
                properties.name ||
                "";
        }

        const full_address: string =
            properties.full_address ||
            properties.place_formatted ||
            properties.address ||
            "";

        if (!name && !full_address) {
            return null;
        }

        return { name: name || full_address, full_address: full_address || name };
    } catch (e) {
        console.log("Failed to fetch Searchbox place label for coords", e);
        return null;
    }
}

export async function obtainWalkingDirections(pickupCoords: Position, destCoords: Position) {
    if (!pickupCoords || !destCoords) throw new Error("Coordinates invalid!")

    const url = `https://api.mapbox.com/directions/v5/mapbox/walking/${pickupCoords[0]},${pickupCoords[1]};${destCoords[0]},${destCoords[1]}`
    const res = await axios.get(url, {
        params: {
            access_token: MAPBOX_ACCESS_TOKEN,
            alternatives: true,
            geometries: "geojson",
            overview: "full",
            steps: true
        }
    })
    return res.data.routes[0].geometry.coordinates;
}
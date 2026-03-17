// shared-utils.ts
export type LatLng = [number, number]; // [lat, lng]

export interface BBox {
  minLat: number;
  minLng: number;
  maxLat: number;
  maxLng: number;
}

/**
 * Compute bounding box for coords in [lat, lng] format.
 * Handles antimeridian by comparing spans in [-180,180] vs [0,360] and picking the smaller span.
 * Returns null if coords empty.
 */
export function computeBBox(coords: LatLng[]): BBox {

  const lats = coords.map(c => c[0]);
  const lons = coords.map(c => c[1]);

  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);

  // normalize to -180..180
  const norm1 = lons.map(l => {
    let v = l;
    while (v <= -180) v += 360;
    while (v > 180) v -= 360;
    return v;
  });
  // normalize to 0..360
  const norm2 = lons.map(l => (l < 0 ? l + 360 : l));

  const span1 = Math.max(...norm1) - Math.min(...norm1);
  const span2 = Math.max(...norm2) - Math.min(...norm2);

  let minLng: number, maxLng: number;
  if (span1 <= span2) {
    minLng = Math.min(...norm1);
    maxLng = Math.max(...norm1);
  } else {
    minLng = Math.min(...norm2);
    maxLng = Math.max(...norm2);
    // convert back to -180..180 for consumers that expect it
    if (minLng > 180) minLng -= 360;
    if (maxLng > 180) maxLng -= 360;
  }

  return { minLat, minLng, maxLat, maxLng };
}

/** Small helper to detect all-equal (single point) */
export function isSinglePoint(bbox: BBox): boolean {
  return bbox.minLat === bbox.maxLat && bbox.minLng === bbox.maxLng;
}
import { getDistance } from 'geolib';

export function haversineDistance(
  from: { lat: number; lng: number },
  to: { lat: number; lng: number },
): number {
  return getDistance(from, to);
}

export function travelTimeMinutes(
  from: { lat: number; lng: number },
  to: { lat: number; lng: number },
  avgSpeedKmh: number = 30,
): number {
  const distanceMeters = haversineDistance(from, to);
  const distanceKm = distanceMeters / 1000;
  return Math.round((distanceKm / avgSpeedKmh) * 60);
}

/** Nearest-neighbor TSP: sort jobs by shortest path from a starting point */
export interface RoutePoint {
  id: string;
  name: string;
  lat: number;
  lng: number;
}

export interface OptimizedRoute {
  point: RoutePoint;
  distanceFromPrev: number;  // meters
  travelTimeMin: number;     // minutes from previous stop
  cumulativeTimeMin: number; // total minutes from start
}

export function optimizeRoute(
  start: { lat: number; lng: number },
  points: RoutePoint[],
): { route: OptimizedRoute[]; totalDistanceM: number; totalTimeMin: number } {
  if (points.length === 0) return { route: [], totalDistanceM: 0, totalTimeMin: 0 };

  const remaining = [...points];
  const route: OptimizedRoute[] = [];
  let currentPos = start;
  let cumulativeTime = 0;
  let totalDistance = 0;

  while (remaining.length > 0) {
    // Find nearest unvisited point
    let bestIdx = 0;
    let bestDist = haversineDistance(currentPos, remaining[0]);

    for (let i = 1; i < remaining.length; i++) {
      const dist = haversineDistance(currentPos, remaining[i]);
      if (dist < bestDist) {
        bestDist = dist;
        bestIdx = i;
      }
    }

    const next = remaining[bestIdx];
    remaining.splice(bestIdx, 1);
    const travelTime = travelTimeMinutes(currentPos, next);
    cumulativeTime += travelTime;
    totalDistance += bestDist;

    route.push({
      point: next,
      distanceFromPrev: bestDist,
      travelTimeMin: travelTime,
      cumulativeTimeMin: cumulativeTime,
    });

    currentPos = next;
  }

  return { route, totalDistanceM: totalDistance, totalTimeMin: cumulativeTime };
}

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

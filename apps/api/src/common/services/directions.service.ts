import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface RouteStop {
  lat: number;
  lng: number;
  name: string;
  id: string;
}

export interface OptimizedStop {
  id: string;
  name: string;
  lat: number;
  lng: number;
  order: number;
  distanceFromPrevKm: number;
  durationFromPrevMin: number;
  cumulativeDistanceKm: number;
  cumulativeDurationMin: number;
}

export interface RouteResult {
  stops: OptimizedStop[];
  totalDistanceKm: number;
  totalDurationMin: number;
  polyline: string; // encoded polyline for map display
}

@Injectable()
export class DirectionsService {
  private readonly logger = new Logger(DirectionsService.name);
  private readonly apiKey: string | null;

  constructor(private configService: ConfigService) {
    this.apiKey = configService.get<string>('GOOGLE_MAPS_API_KEY') || null;
    if (!this.apiKey) {
      this.logger.warn('GOOGLE_MAPS_API_KEY not set — Directions API disabled, using Haversine fallback');
    }
  }

  /** Optimize a route using Google Directions API. Falls back to Haversine if API unavailable. */
  async optimizeRoute(
    start: { lat: number; lng: number },
    stops: RouteStop[],
  ): Promise<RouteResult> {
    if (stops.length === 0) {
      return { stops: [], totalDistanceKm: 0, totalDurationMin: 0, polyline: '' };
    }

    if (stops.length === 1) {
      return {
        stops: [{
          id: stops[0].id, name: stops[0].name,
          lat: stops[0].lat, lng: stops[0].lng,
          order: 1, distanceFromPrevKm: 0, durationFromPrevMin: 0,
          cumulativeDistanceKm: 0, cumulativeDurationMin: 0,
        }],
        totalDistanceKm: 0, totalDurationMin: 0, polyline: '',
      };
    }

    // Try Google Directions API first
    if (this.apiKey) {
      try {
        return await this.directionsOptimize(start, stops);
      } catch (err) {
        this.logger.warn(`Directions API failed, falling back to Haversine: ${err instanceof Error ? err.message : String(err)}`);
      }
    }

    // Fallback to Haversine nearest-neighbor
    return this.haversineFallback(start, stops);
  }

  private async directionsOptimize(start: { lat: number; lng: number }, stops: RouteStop[]): Promise<RouteResult> {
    const origin = `${start.lat},${start.lng}`;
    const destination = `${stops[stops.length - 1].lat},${stops[stops.length - 1].lng}`;

    // Let Google optimize waypoint order
    const waypoints = stops.slice(0, -1).map(s => `${s.lat},${s.lng}`).join('|');
    const wpParam = `optimize:true|${waypoints}`;

    const url = `https://maps.googleapis.com/maps/api/directions/json?${new URLSearchParams({
      origin,
      destination,
      waypoints: wpParam,
      key: this.apiKey!,
      mode: 'driving',
      departure_time: 'now',
    })}`;

    const res = await fetch(url);
    const data = await res.json();

    if (data.status !== 'OK' || !data.routes?.length) {
      throw new Error(`Directions API returned status=${data.status}`);
    }

    const route = data.routes[0];
    const legs = route.legs;
    const waypointOrder: number[] = route.waypoint_order || [];

    // Build the ordered stops list: Google reorders waypoints, returns indices
    // The order is: [first waypoint (stop 0)] ... [last stop]
    // waypoint_order tells us the new indices for waypoints 0..n-2
    const orderedIndices = [0, ...waypointOrder.map(i => i + 1), stops.length - 1];
    const orderedStops = orderedIndices.map(i => stops[i]);

    let cumulativeDist = 0;
    let cumulativeDur = 0;
    const result: OptimizedStop[] = [];

    for (let i = 0; i < orderedStops.length; i++) {
      const leg = legs[i];
      const distKm = leg ? Math.round(leg.distance.value / 10) / 100 : 0; // meters → km
      const durMin = leg ? Math.round(leg.duration.value / 6) / 10 : 0;    // seconds → minutes

      cumulativeDist += distKm;
      cumulativeDur += durMin;

      result.push({
        id: orderedStops[i].id,
        name: orderedStops[i].name,
        lat: orderedStops[i].lat,
        lng: orderedStops[i].lng,
        order: i + 1,
        distanceFromPrevKm: distKm,
        durationFromPrevMin: durMin,
        cumulativeDistanceKm: Math.round(cumulativeDist * 100) / 100,
        cumulativeDurationMin: Math.round(cumulativeDur * 10) / 10,
      });
    }

    const totalDistKm = Math.round(cumulativeDist * 100) / 100;
    const totalDurMin = Math.round(cumulativeDur * 10) / 10;

    this.logger.log(`Directions API: ${stops.length} stops optimized, ${totalDistKm}km, ${totalDurMin}min`);

    return {
      stops: result,
      totalDistanceKm: totalDistKm,
      totalDurationMin: totalDurMin,
      polyline: route.overview_polyline?.points || '',
    };
  }

  private haversineFallback(start: { lat: number; lng: number }, stops: RouteStop[]): RouteResult {
    // Simple nearest-neighbor (imported from distance.util)
    const { haversineDistance, travelTimeMinutes } = require('src/common/utils/distance.util');

    const remaining = [...stops];
    const result: OptimizedStop[] = [];
    let current = start;
    let cumDist = 0;
    let cumDur = 0;

    while (remaining.length > 0) {
      let best = 0;
      let bestDist = haversineDistance(current, remaining[0]);
      for (let i = 1; i < remaining.length; i++) {
        const d = haversineDistance(current, remaining[i]);
        if (d < bestDist) { bestDist = d; best = i; }
      }
      const next = remaining[best];
      remaining.splice(best, 1);
      const distKm = Math.round(bestDist / 10) / 100;
      const durMin = travelTimeMinutes(current, next);
      cumDist += distKm;
      cumDur += durMin;

      result.push({
        id: next.id, name: next.name, lat: next.lat, lng: next.lng,
        order: result.length + 1,
        distanceFromPrevKm: distKm, durationFromPrevMin: durMin,
        cumulativeDistanceKm: Math.round(cumDist * 100) / 100,
        cumulativeDurationMin: Math.round(cumDur * 10) / 10,
      });
      current = next;
    }

    return { stops: result, totalDistanceKm: Math.round(cumDist * 100) / 100, totalDurationMin: Math.round(cumDur * 10) / 10, polyline: '' };
  }
}

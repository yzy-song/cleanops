import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface LatLng {
  lat: number;
  lng: number;
}

@Injectable()
export class GeocodingService {
  private readonly logger = new Logger(GeocodingService.name);
  private readonly apiKey: string | undefined;

  constructor(private configService: ConfigService) {
    this.apiKey = configService.get<string>('GOOGLE_MAPS_API_KEY');
    if (!this.apiKey) {
      this.logger.warn('GOOGLE_MAPS_API_KEY not set — geocoding disabled');
    }
  }

  async geocode(postalCode: string): Promise<LatLng | null> {
    if (!this.apiKey || !postalCode) return null;

    try {
      const url = `https://maps.googleapis.com/maps/api/geocode/json?${new URLSearchParams({
        address: postalCode,
        key: this.apiKey,
      })}`;

      const res = await fetch(url);
      const data = await res.json();

      if (data.status !== 'OK' || !data.results?.length) {
        this.logger.warn(`Geocoding returned status=${data.status} for postalCode="${postalCode}"`);
        return null;
      }

      const { lat, lng } = data.results[0].geometry.location;
      return { lat, lng };
    } catch (err) {
      this.logger.error(`Geocoding failed for postalCode="${postalCode}": ${(err as Error).message}`);
      return null;
    }
  }

  /** Reverse lookup: postal code → formatted address */
  async reverseLookup(postalCode: string): Promise<string | null> {
    if (!this.apiKey || !postalCode) return null;

    try {
      const url = `https://maps.googleapis.com/maps/api/geocode/json?${new URLSearchParams({
        address: postalCode + ' Ireland',
        region: 'ie',
        key: this.apiKey,
      })}`;

      const res = await fetch(url);
      const data = await res.json();

      if (data.status === 'OK' && data.results?.length > 0) {
        return data.results[0].formatted_address;
      }
      this.logger.warn(`Reverse lookup returned status=${data.status} for "${postalCode}"`);
      return null;
    } catch (err) {
      this.logger.error(`Reverse lookup failed for "${postalCode}": ${(err as Error).message}`);
      return null;
    }
  }
}

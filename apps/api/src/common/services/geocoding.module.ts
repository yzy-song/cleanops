import { Module, Global } from '@nestjs/common';
import { GeocodingService } from './geocoding.service';
import { DirectionsService } from './directions.service';

@Global()
@Module({
  providers: [GeocodingService, DirectionsService],
  exports: [GeocodingService, DirectionsService],
})
export class GeocodingModule {}

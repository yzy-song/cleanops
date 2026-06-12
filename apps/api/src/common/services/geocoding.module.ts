import { Module, Global } from '@nestjs/common';
import { GeocodingService } from './geocoding.service';
import { DirectionsService } from './directions.service';
import { GeocodeController } from './geocode.controller';

@Global()
@Module({
  controllers: [GeocodeController],
  providers: [GeocodingService, DirectionsService],
  exports: [GeocodingService, DirectionsService],
})
export class GeocodingModule {}

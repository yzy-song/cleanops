import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { GeocodingService } from './geocoding.service';
import { Auth } from '../../auth/decorators/auth.decorator';

@ApiTags('Geocode')
@Controller('geocode')
export class GeocodeController {
  constructor(private readonly geocodingService: GeocodingService) {}

  @Get('lookup')
  @Auth()
  @ApiOperation({ summary: 'Look up address from Eircode/postal code' })
  async lookup(@Query('postalCode') postalCode: string) {
    if (!postalCode) return { success: false, message: 'postalCode is required' };

    const address = await this.geocodingService.reverseLookup(postalCode);
    return { success: true, data: { address } };
  }
}

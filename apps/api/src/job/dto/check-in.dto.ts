import { ApiProperty } from '@nestjs/swagger';
import { IsNumber } from 'class-validator';

export class CheckInDto {
  @ApiProperty({ example: 53.3498 })
  @IsNumber()
  lat: number;

  @ApiProperty({ example: -6.2603 })
  @IsNumber()
  lng: number;
}

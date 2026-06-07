import { IsString, IsOptional, IsEnum, IsInt, IsBoolean, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateServiceDto {
  @ApiProperty({ example: 'Regular Cleaning' })
  @IsString()
  name: string;

  @ApiProperty({ required: false, example: 'Routine home upkeep' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ enum: ['FIXED', 'HOURLY', 'PER_ROOM'], default: 'FIXED' })
  @IsOptional()
  @IsEnum(['FIXED', 'HOURLY', 'PER_ROOM'])
  pricingModel?: string;

  @ApiProperty({ default: 0, description: 'Base price in cents' })
  @IsOptional()
  @IsInt()
  @Min(0)
  basePrice?: number;

  @ApiProperty({ default: 60, description: 'Estimated duration in minutes' })
  @IsOptional()
  @IsInt()
  @Min(10)
  @Max(480)
  durationMin?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiProperty({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiProperty({ default: 0 })
  @IsOptional()
  @IsInt()
  sortOrder?: number;
}

import { IsString, IsEmail, IsBoolean, IsOptional, IsEnum, IsInt, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ServiceType, PropertySize, ServiceFrequency } from '@cleanops/db';

export class CalculateQuotePriceDto {
  @ApiProperty({ enum: ServiceType })
  @IsEnum(ServiceType)
  serviceType: ServiceType;

  @ApiProperty({ enum: PropertySize })
  @IsEnum(PropertySize)
  propertySize: PropertySize;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(20)
  bathrooms?: number;

  @ApiProperty({ enum: ServiceFrequency })
  @IsEnum(ServiceFrequency)
  frequency: ServiceFrequency;

  @ApiProperty()
  @IsBoolean()
  isCommercial: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  companyId?: string;
}

export class CreateQuoteFromPortalDto {
  @ApiProperty({ enum: ServiceType })
  @IsEnum(ServiceType)
  serviceType: ServiceType;

  @ApiProperty({ enum: PropertySize })
  @IsEnum(PropertySize)
  propertySize: PropertySize;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(20)
  bathrooms?: number;

  @ApiProperty({ enum: ServiceFrequency })
  @IsEnum(ServiceFrequency)
  frequency: ServiceFrequency;

  @ApiProperty()
  @IsBoolean()
  isCommercial: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty()
  @IsEmail()
  email: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty()
  @IsString()
  address: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  postalCode?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  accessCode?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  companyId?: string;
}

export class DeclineQuoteDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  reason?: string;
}

export class CreateBookingDto {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty()
  @IsEmail()
  email: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty()
  @IsString()
  address: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  postalCode?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  accessCode?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsInt()
  lat?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsInt()
  lng?: number;

  @ApiProperty()
  @IsString()
  scheduledDate: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  companyId?: string;
}

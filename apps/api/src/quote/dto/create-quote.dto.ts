import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsBoolean, IsOptional, IsEnum, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ServiceType, PropertySize, ServiceFrequency } from '@cleanops/db';

export class QuoteLineItemDto {
  @ApiProperty({ example: 'Regular house cleaning (2 hours)' })
  @IsString()
  description: string;

  @ApiProperty({ example: 2 })
  @IsNumber()
  quantity: number;

  @ApiProperty({ example: 1480, description: '单价（分）' })
  @IsNumber()
  unitPrice: number;

  @ApiProperty({ example: 2960, description: '合计（分）' })
  @IsNumber()
  totalPrice: number;
}

export class CreateQuoteDto {
  @ApiProperty({ enum: ServiceType, example: 'REGULAR', required: false })
  @IsOptional()
  @IsEnum(ServiceType)
  serviceType?: ServiceType;

  @ApiProperty({ enum: PropertySize, example: 'TWO_BED', required: false })
  @IsOptional()
  @IsEnum(PropertySize)
  propertySize?: PropertySize;

  @ApiProperty({ required: false, example: 1 })
  @IsOptional()
  @IsNumber()
  bathrooms?: number;

  @ApiProperty({ enum: ServiceFrequency, example: 'ONE_OFF', required: false })
  @IsOptional()
  @IsEnum(ServiceFrequency)
  frequency?: ServiceFrequency;

  @ApiProperty({ example: false, required: false })
  @IsOptional()
  @IsBoolean()
  isCommercial?: boolean;

  @ApiProperty({ example: 120, description: '预估时长（分钟）', required: false })
  @IsOptional()
  @IsNumber()
  estimatedDuration?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  notes?: string;

  // 手动定价覆盖
  @ApiProperty({ required: false, description: '不含税金额（分），覆盖自动计算' })
  @IsOptional()
  @IsNumber()
  subtotal?: number;

  @ApiProperty({ required: false, description: '税额（分）' })
  @IsOptional()
  @IsNumber()
  vatAmount?: number;

  @ApiProperty({ required: false, description: '定金（分）' })
  @IsOptional()
  @IsNumber()
  depositAmount?: number;

  // 已有客户
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  customerId?: string;

  // 新客户
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  customerName?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  customerEmail?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  customerPhone?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  customerAddress?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  customerPostalCode?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  customerAccessCode?: string;

  // 手动行项
  @ApiProperty({ required: false, type: [QuoteLineItemDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QuoteLineItemDto)
  lineItems?: QuoteLineItemDto[];
}

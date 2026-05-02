import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsNumber, Min, Max } from 'class-validator';

export class CreateCustomerDto {
  @ApiProperty({ example: 'Alice Johnson' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: '123 Dublin St, Dublin 2', description: '完整地址' })
  @IsString()
  @IsNotEmpty()
  address: string;

  @ApiProperty({ example: 'D02 X123', description: '爱尔兰 Eircode' })
  @IsOptional()
  @IsString()
  eircode?: string;

  @ApiProperty({ example: 'Key under the mat / Code: 1234', description: '入户方式' })
  @IsOptional()
  @IsString()
  accessCode?: string;

  @ApiProperty({ example: 53.3498 })
  @IsOptional()
  @IsNumber()
  @Min(-90)
  @Max(90)
  lat?: number;

  @ApiProperty({ example: -6.2603 })
  @IsOptional()
  @IsNumber()
  @Min(-180)
  @Max(180)
  lng?: number;

  @ApiProperty({ example: 'uuid-of-company', required: false })
  @IsOptional()
  @IsString()
  companyId?: string;

  @ApiProperty({ example: true, description: '商业/住宅', required: false })
  @IsOptional()
  isCommercial?: boolean;
}

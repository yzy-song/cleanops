import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsInt, Min } from 'class-validator';

export class CreateCompanyDto {
  @ApiProperty({ example: 'Joy Cleaning Ltd', description: '公司名称' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'IE1234567W', required: false, description: '爱尔兰 VAT 税号' })
  @IsOptional()
  @IsString()
  vatNumber?: string;

  @ApiProperty({ example: 1550, default: 1480, description: '起薪(分)，1550=15.50欧' })
  @IsOptional()
  @IsInt()
  @Min(1000)
  baseHourlyRate?: number;
}

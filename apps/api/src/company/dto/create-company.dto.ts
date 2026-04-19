import { ApiProperty } from '@nestjs/swagger';

export class CreateCompanyDto {
  @ApiProperty({ example: 'Joy Cleaning Ltd', description: '公司名称' })
  name: string;

  @ApiProperty({ example: 'IE1234567W', required: false, description: '爱尔兰 VAT 税号' })
  vatNumber?: string;

  @ApiProperty({ example: 1550, default: 1480, description: '起薪(分)，1550=15.50欧' })
  baseHourlyRate?: number;
}

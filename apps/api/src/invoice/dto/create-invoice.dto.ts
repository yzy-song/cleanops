import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsInt, Min } from 'class-validator';

export class CreateInvoiceDto {
  @ApiProperty({ example: 'job-uuid', description: '关联任务ID' })
  @IsString()
  @IsNotEmpty()
  jobId: string;

  @ApiProperty({ example: 5000, description: '总金额（分）' })
  @IsInt()
  @Min(1)
  amount: number;

  @ApiProperty({ example: 750, description: 'VAT 税额（分）' })
  @IsInt()
  @Min(0)
  vatAmount: number;

  @ApiProperty({ example: 75, description: '养老金提留额（分）', required: false, default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  pensionAmount?: number;

  @ApiProperty({ example: 'company-uuid' })
  @IsString()
  @IsNotEmpty()
  companyId: string;
}

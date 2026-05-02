import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsDateString, IsArray, IsBoolean, IsOptional, IsIn } from 'class-validator';

export class CreateJobDto {
  @ApiProperty({ example: '2026-05-01T09:00:00Z' })
  @IsDateString()
  scheduledStart: string;

  @ApiProperty({ example: 120, description: '预计耗时（分钟）', required: false })
  @IsOptional()
  @IsNumber()
  estimatedDuration?: number;

  @ApiProperty({ example: 'customer-uuid' })
  @IsString()
  customerId: string;

  @ApiProperty({ example: ['worker-uuid-1'], description: '指派的员工ID列表', required: false })
  @IsOptional()
  @IsArray()
  workerIds?: string[];

  @ApiProperty({ example: '请带上备用钥匙', required: false })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({ example: false, required: false })
  @IsOptional()
  @IsBoolean()
  isRecurring?: boolean;

  @ApiProperty({ example: 'WEEKLY', description: 'WEEKLY | BI-WEEKLY', required: false })
  @IsOptional()
  @IsIn(['WEEKLY', 'BI-WEEKLY'])
  recurrenceRule?: string;

  @ApiProperty({ example: 5000, description: '定金金额（分），爱尔兰 end-of-tenancy 等场景', required: false })
  @IsOptional()
  @IsNumber()
  depositAmount?: number;
}

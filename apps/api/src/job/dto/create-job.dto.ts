import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsDateString, IsArray, IsOptional } from 'class-validator';

export class CreateJobDto {
  @ApiProperty({ example: '2026-05-01T09:00:00Z' })
  @IsDateString()
  scheduledStart: string;

  @ApiProperty({ example: 120, description: '预计耗时（分钟）' })
  @IsNumber()
  estimatedDuration: number;

  @ApiProperty({ example: 'customer-uuid' })
  @IsString()
  customerId: string;

  @ApiProperty({ example: ['worker-uuid-1'], description: '指派的员工ID列表' })
  @IsArray()
  workerIds: string[];

  @ApiProperty({ example: '请带上备用钥匙', required: false })
  @IsOptional()
  @IsString()
  notes?: string;
}

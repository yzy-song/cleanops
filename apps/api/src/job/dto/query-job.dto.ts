import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsDateString } from 'class-validator';
import { PaginationDto } from '../../common/dto/pagination.dto';

export class QueryJobDto extends PaginationDto {
  @ApiProperty({ required: false, description: '按状态筛选: PENDING, IN_PROGRESS, COMPLETED, ISSUE, CANCELLED' })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiProperty({ required: false, description: '按客户ID筛选' })
  @IsOptional()
  @IsString()
  customerId?: string;

  @ApiProperty({ required: false, description: '按员工ID筛选' })
  @IsOptional()
  @IsString()
  workerId?: string;

  @ApiProperty({ required: false, description: '开始日期 (ISO 8601)' })
  @IsOptional()
  @IsDateString()
  fromDate?: string;

  @ApiProperty({ required: false, description: '结束日期 (ISO 8601)' })
  @IsOptional()
  @IsDateString()
  toDate?: string;
}

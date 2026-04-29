import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { PaginationDto } from '../../common/dto/pagination.dto';

export class QueryInvoiceDto extends PaginationDto {
  @ApiProperty({ required: false, description: 'UNPAID, PAID, VOID' })
  @IsOptional()
  @IsString()
  status?: string;
}

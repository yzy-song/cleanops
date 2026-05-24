import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { PaginationDto } from '../../common/dto/pagination.dto';

export class QueryQuoteDto extends PaginationDto {
  @ApiProperty({ required: false, description: 'DRAFT, SENT, ACCEPTED, DECLINED, EXPIRED' })
  @IsOptional()
  @IsString()
  status?: string;
}

import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsInt, Min } from 'class-validator';

export class UpdateInvoiceDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsInt()
  @Min(1)
  amount?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsInt()
  @Min(0)
  vatAmount?: number;

  @ApiProperty({ required: false, description: 'UNPAID, PAID, VOID' })
  @IsOptional()
  @IsString()
  status?: string;
}

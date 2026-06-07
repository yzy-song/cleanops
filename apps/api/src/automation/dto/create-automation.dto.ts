import { IsString, IsBoolean, IsOptional, IsObject } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateAutomationDto {
  @ApiProperty({ example: 'Send invoice reminder' })
  @IsString()
  name: string;

  @ApiProperty({ enum: ['JOB_COMPLETED', 'INVOICE_OVERDUE', 'QUOTE_ACCEPTED'] })
  @IsString()
  trigger: string;

  @ApiProperty({ enum: ['SEND_EMAIL'] })
  @IsString()
  action: string;

  @ApiProperty({ example: { subject: 'Thank you!', body: 'Your cleaning is complete.' } })
  @IsObject()
  config: Record<string, any>;

  @ApiProperty({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

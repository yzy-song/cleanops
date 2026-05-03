import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsIn } from 'class-validator';

export class CreateCheckoutDto {
  @ApiProperty({ example: 'PRO', description: 'STARTER | PRO | BUSINESS' })
  @IsString()
  @IsIn(['STARTER', 'PRO', 'BUSINESS'])
  plan: string;
}

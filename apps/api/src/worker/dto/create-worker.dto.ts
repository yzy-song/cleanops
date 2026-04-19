import { ApiProperty } from '@nestjs/swagger';

export class CreateWorkerDto {
  @ApiProperty({ example: 'Liam' })
  firstName: string;

  @ApiProperty({ example: 'Murphy' })
  lastName: string;

  @ApiProperty({ example: '0851234567', description: 'WhatsApp 登录凭证' })
  phone: string;

  @ApiProperty({ example: '1234567FA', description: '爱尔兰 PPSN 号码', required: false })
  ppsn?: string;

  @ApiProperty({ example: 1600, description: '个体时薪(分)', required: false })
  hourlyRate?: number;

  @ApiProperty({ example: 'company-uuid-here' })
  companyId: string;
}

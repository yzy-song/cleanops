import { ApiProperty } from '@nestjs/swagger';

export class CreateWorkerDto {
  @ApiProperty({ example: 'Liam' })
  firstName: string;

  @ApiProperty({ example: 'Murphy' })
  lastName: string;

  @ApiProperty({ example: '0851234567', description: '电话号码' })
  phone: string;

  @ApiProperty({ example: 'liam.murphy@example.com', description: '邮箱地址' })
  email: string;

  @ApiProperty({ example: '1234567FA', description: 'PPSN 号码', required: false })
  ppsn?: string;

  @ApiProperty({ example: 1600, description: '时薪(分)', required: false })
  hourlyRate?: number;

  @ApiProperty({ example: 'company-uuid-here' })
  companyId: string;
}

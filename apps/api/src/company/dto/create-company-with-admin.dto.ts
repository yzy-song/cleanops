import { ApiProperty } from '@nestjs/swagger';
import { CreateCompanyDto } from './create-company.dto';

export class CreateCompanyWithAdminDto extends CreateCompanyDto {
  @ApiProperty({ example: 'admin@company.com', description: '管理员邮箱' })
  adminEmail: string;

  @ApiProperty({ example: 'securePassword123', description: '管理员密码' })
  adminPass: string;
}
import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';
import { CreateCompanyDto } from './create-company.dto';

export class CreateCompanyWithAdminDto extends CreateCompanyDto {
  @ApiProperty({ example: 'admin@company.com', description: '管理员邮箱' })
  @IsEmail()
  adminEmail: string;

  @ApiProperty({ example: 'securePassword123', description: '管理员密码' })
  @IsString()
  @MinLength(6)
  adminPass: string;
}
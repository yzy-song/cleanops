import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsInt, IsEmail, Min } from 'class-validator';

export class CreateWorkerDto {
  @ApiProperty({ example: 'Liam' })
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @ApiProperty({ example: 'Murphy' })
  @IsString()
  @IsNotEmpty()
  lastName: string;

  @ApiProperty({ example: '0851234567', description: '电话号码' })
  @IsString()
  @IsNotEmpty()
  phone: string;

  @ApiProperty({ example: 'liam.murphy@example.com', description: '邮箱地址' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: '1234567FA', description: 'PPSN 号码', required: false })
  @IsOptional()
  @IsString()
  ppsn?: string;

  @ApiProperty({ example: 1600, description: '时薪(分)', required: false })
  @IsOptional()
  @IsInt()
  @Min(1100)
  hourlyRate?: number;

}

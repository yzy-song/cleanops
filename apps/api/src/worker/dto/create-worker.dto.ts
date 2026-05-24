import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsInt, IsEmail, IsArray, IsNumber, Min, Max } from 'class-validator';
import { ServiceType } from '@cleanops/db';

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

  @ApiProperty({ example: 'D02 X123', description: 'Eircode 或类似邮编', required: false })
  @IsOptional()
  @IsString()
  postalCode?: string;

  @ApiProperty({ example: 53.3498, required: false })
  @IsOptional()
  @IsNumber()
  @Min(-90)
  @Max(90)
  lat?: number;

  @ApiProperty({ example: -6.2603, required: false })
  @IsOptional()
  @IsNumber()
  @Min(-180)
  @Max(180)
  lng?: number;

  @ApiProperty({ example: ['REGULAR', 'DEEP_CLEAN'], description: '技能标签', required: false })
  @IsOptional()
  @IsArray()
  skills?: ServiceType[];

  @ApiProperty({ example: [1, 2, 3, 4, 5], description: '工作日 (0=周日, 6=周六)', required: false })
  @IsOptional()
  @IsArray()
  workDays?: number[];
}

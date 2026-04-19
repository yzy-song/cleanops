import { ApiProperty } from '@nestjs/swagger';

export class CreateCustomerDto {
  @ApiProperty({ example: 'Alice Johnson' })
  name: string;

  @ApiProperty({ example: '123 Dublin St, Dublin 2', description: '完整地址' })
  address: string;

  @ApiProperty({ example: 'D02 X123', description: '爱尔兰 Eircode' })
  eircode?: string;

  @ApiProperty({ example: 'Key under the mat / Code: 1234', description: '入户方式' })
  accessCode?: string;

  @ApiProperty({ example: 53.3498 })
  lat?: number;

  @ApiProperty({ example: -6.2603 })
  lng?: number;

  @ApiProperty({ example: 'uuid-of-company' })
  companyId: string;
}

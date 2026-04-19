import { Injectable } from '@nestjs/common';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class CustomerService {
  constructor(private prisma: PrismaService) {}
  async create(dto: CreateCustomerDto) {
    return this.prisma.client.customer.create({
      data: {
        name: dto.name,
        address: dto.address,
        eircode: dto.eircode,
        accessCode: dto.accessCode,
        lat: dto.lat,
        lng: dto.lng,
        // 关键点：使用 connect 方式关联公司，
        // 这样即使 TS 类型推导混乱，Prisma 也能明确知道这是在做外键关联。
        company: {
          connect: { id: dto.companyId },
        },
      },
    });
  }

  async findAll(companyId: string) {
    return this.prisma.client.customer.findMany({
      where: { companyId },
      include: { jobs: { take: 5, orderBy: { createdAt: 'desc' } } }, // 顺便查出最近5个客户
    });
  }

  findOne(id: number) {
    return `This action returns a #${id} customer`;
  }

  update(id: number, updateCustomerDto: UpdateCustomerDto) {
    return `This action updates a #${id} customer`;
  }

  remove(id: number) {
    return `This action removes a #${id} customer`;
  }
}

import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class CustomerAuthGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing or invalid token');
    }

    const token = authHeader.slice(7);
    const customer = await this.prisma.client.customer.findFirst({
      where: { authToken: token },
    });

    if (!customer) throw new UnauthorizedException('Invalid token');
    if (customer.authTokenExpiresAt && customer.authTokenExpiresAt < new Date()) {
      throw new UnauthorizedException('Token expired');
    }

    request.customer = customer;
    return true;
  }
}

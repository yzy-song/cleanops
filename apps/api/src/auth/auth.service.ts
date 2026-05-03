import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { CreateAuthDto } from './dto/create-auth.dto';
import { UpdateAuthDto } from './dto/update-auth.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { EmailService } from 'src/email/email.service';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private emailService: EmailService,
  ) {}
  create(createAuthDto: CreateAuthDto) {
    return 'This action adds a new auth';
  }

  findAll() {
    return `This action returns all auth`;
  }

  findOne(id: number) {
    return `This action returns a #${id} auth`;
  }

  update(id: number, updateAuthDto: UpdateAuthDto) {
    return `This action updates a #${id} auth`;
  }

  remove(id: number) {
    return `This action removes a #${id} auth`;
  }

  async login(email: string, pass: string) {
    const user = await this.prisma.client.user.findUnique({
      where: { email },
    });

    if (!user || !(await bcrypt.compare(pass, user.password))) {
      throw new UnauthorizedException('邮箱或密码错误');
    }

    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      companyId: user.companyId,
    };

    const accessToken = this.jwtService.sign(payload);

    // Generate refresh token (raw → store sha256 hash → return raw)
    const rawRefreshToken = crypto.randomBytes(48).toString('hex');
    const refreshTokenHash = crypto.createHash('sha256').update(rawRefreshToken).digest('hex');

    await this.prisma.client.user.update({
      where: { id: user.id },
      data: { refreshToken: refreshTokenHash },
    });

    return {
      access_token: accessToken,
      refresh_token: rawRefreshToken,
    };
  }

  async forgotPassword(email: string) {
    const user = await this.prisma.client.user.findUnique({
      where: { email },
    });

    // 无论用户是否存在都返回成功，防止邮箱枚举攻击
    if (!user) return;

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 分钟

    await this.prisma.client.user.update({
      where: { id: user.id },
      data: { resetToken, resetTokenExpiresAt },
    });

    await this.emailService.sendPasswordResetEmail(email, resetToken);
  }

  async resetPassword(token: string, newPassword: string) {
    const user = await this.prisma.client.user.findFirst({
      where: {
        resetToken: token,
        resetTokenExpiresAt: { gt: new Date() },
      },
    });

    if (!user) {
      throw new BadRequestException('重置链接无效或已过期');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await this.prisma.client.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetToken: null,
        resetTokenExpiresAt: null,
      },
    });
  }

  async refresh(refreshToken: string) {
    const hash = crypto.createHash('sha256').update(refreshToken).digest('hex');

    const user = await this.prisma.client.user.findFirst({
      where: { refreshToken: hash },
    });

    if (!user) {
      throw new UnauthorizedException('无效的 refresh token');
    }

    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      companyId: user.companyId,
    };

    const accessToken = this.jwtService.sign(payload);

    // Rotate refresh token
    const rawRefreshToken = crypto.randomBytes(48).toString('hex');
    const refreshTokenHash = crypto.createHash('sha256').update(rawRefreshToken).digest('hex');

    await this.prisma.client.user.update({
      where: { id: user.id },
      data: { refreshToken: refreshTokenHash },
    });

    return {
      access_token: accessToken,
      refresh_token: rawRefreshToken,
    };
  }

  async changePassword(userId: string, oldPassword: string, newPassword: string) {
    const user = await this.prisma.client.user.findUnique({
      where: { id: userId },
    });

    if (!user || !(await bcrypt.compare(oldPassword, user.password))) {
      throw new BadRequestException('原密码错误');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await this.prisma.client.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });
  }
}

import { ForbiddenException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'nestjs-prisma';
import { Role, type User } from '@prisma/client';
import type { ListUsersDto } from './dto/list-users.dto';
import type { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(private readonly prisma: PrismaService) {}

  async list(
    query: ListUsersDto,
  ): Promise<{ items: User[]; total: number; page: number; limit: number }> {
    const where = query.role ? { role: query.role } : {};
    const [items, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      this.prisma.user.count({ where }),
    ]);
    return { items, total, page: query.page, limit: query.limit };
  }

  async findById(id: string): Promise<User> {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user)
      throw new NotFoundException({ code: 'USER_NOT_FOUND', message: 'User không tồn tại' });
    return user;
  }

  async update(
    targetId: string,
    requester: { sub: string; role: Role },
    dto: UpdateUserDto,
  ): Promise<User> {
    const isAdmin = requester.role === Role.ADMIN;
    const isSelf = requester.sub === targetId;
    if (!isAdmin && !isSelf) {
      throw new ForbiddenException({
        code: 'FORBIDDEN',
        message: 'Chỉ admin hoặc chính chủ mới update được',
      });
    }

    await this.findById(targetId); // 404 nếu không có

    if (dto.email) {
      const emailTaken = await this.prisma.user.findFirst({
        where: { email: dto.email, NOT: { id: targetId } },
      });
      if (emailTaken) {
        throw new ForbiddenException({ code: 'EMAIL_TAKEN', message: 'Email đã được dùng' });
      }
    }

    return this.prisma.user.update({
      where: { id: targetId },
      data: {
        email: dto.email,
        avatarUrl: dto.avatarUrl,
      },
    });
  }

  async ban(targetId: string, requesterId: string): Promise<User> {
    if (targetId === requesterId) {
      throw new ForbiddenException({ code: 'BAN_SELF', message: 'Không thể ban chính mình' });
    }
    const target = await this.findById(targetId);
    if (target.role === Role.ADMIN) {
      throw new ForbiddenException({ code: 'BAN_ADMIN', message: 'Không thể ban admin' });
    }

    // Revoke all active refresh tokens → kick out session
    await this.prisma.refreshToken.updateMany({
      where: { userId: targetId, revokedAt: null },
      data: { revokedAt: new Date() },
    });

    this.logger.warn(`User ${targetId} banned by ${requesterId}`);
    return this.prisma.user.update({
      where: { id: targetId },
      data: { role: Role.BANNED },
    });
  }

  async unban(targetId: string, requesterId: string): Promise<User> {
    const target = await this.findById(targetId);
    if (target.role !== Role.BANNED) {
      throw new ForbiddenException({ code: 'NOT_BANNED', message: 'User không bị ban' });
    }
    this.logger.log(`User ${targetId} unbanned by ${requesterId}`);
    return this.prisma.user.update({
      where: { id: targetId },
      data: { role: Role.USER },
    });
  }
}

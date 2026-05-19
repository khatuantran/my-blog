import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Role, type User } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import type { AuthenticatedUser } from '../auth/jwt-payload';
import { UsersService } from './users.service';
import { ListUsersDto } from './dto/list-users.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PaginatedUsersDto, UserResponseDto } from './dto/user-response.dto';

type Skill = { name: string; color: string };

function parseSkills(value: unknown): Skill[] {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (v): v is Skill =>
      typeof v === 'object' &&
      v !== null &&
      typeof (v as { name?: unknown }).name === 'string' &&
      typeof (v as { color?: unknown }).color === 'string',
  );
}

function toUserResponse(user: User): UserResponseDto {
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    role: user.role,
    avatarUrl: user.avatarUrl,
    title: user.title ?? null,
    bio: user.bio ?? null,
    skills: parseSkills(user.skills),
    createdAt: user.createdAt,
  };
}

function toPublicUserResponse(user: User): UserResponseDto {
  return { ...toUserResponse(user), email: null };
}

@ApiTags('users')
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get()
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'List users (admin only)' })
  @ApiResponse({ status: 200, type: PaginatedUsersDto })
  async list(@Query() query: ListUsersDto): Promise<PaginatedUsersDto> {
    const { items, total, page, limit } = await this.users.list(query);
    return { items: items.map(toUserResponse), total, page, limit };
  }

  @Public()
  @Get('by-username/:username')
  @ApiOperation({ summary: 'Public lookup by username (FR-11.1) — email hidden' })
  async getByUsername(@Param('username') username: string): Promise<UserResponseDto> {
    return toPublicUserResponse(await this.users.findByUsername(username));
  }

  @Public()
  @Get(':id/stats')
  @ApiOperation({ summary: 'Profile stats: posts/likes/views + streak + heatmap28d (FR-11.4)' })
  getStats(@Param('id') id: string) {
    return this.users.getStats(id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user by id (admin hoặc self)' })
  @ApiResponse({ status: 200, type: UserResponseDto })
  async get(
    @Param('id') id: string,
    @CurrentUser() requester: AuthenticatedUser,
  ): Promise<UserResponseDto> {
    const isAdmin = requester.role === Role.ADMIN;
    const isSelf = requester.sub === id;
    const u = await this.users.findById(id);
    if (!isAdmin && !isSelf) {
      return toPublicUserResponse(u);
    }
    return toUserResponse(u);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update user (admin hoặc self) — email/avatar/title/bio/skills' })
  @ApiResponse({ status: 200, type: UserResponseDto })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
    @CurrentUser() requester: AuthenticatedUser,
  ): Promise<UserResponseDto> {
    const user = await this.users.update(id, { sub: requester.sub, role: requester.role }, dto);
    return toUserResponse(user);
  }

  @Post(':id/ban')
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Ban user (admin only) — set role BANNED + revoke refresh tokens' })
  @ApiResponse({ status: 200, type: UserResponseDto })
  async ban(
    @Param('id') id: string,
    @CurrentUser() requester: AuthenticatedUser,
  ): Promise<UserResponseDto> {
    return toUserResponse(await this.users.ban(id, requester.sub));
  }

  @Post(':id/unban')
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Unban user (admin only) — set role USER' })
  @ApiResponse({ status: 200, type: UserResponseDto })
  async unban(
    @Param('id') id: string,
    @CurrentUser() requester: AuthenticatedUser,
  ): Promise<UserResponseDto> {
    return toUserResponse(await this.users.unban(id, requester.sub));
  }
}

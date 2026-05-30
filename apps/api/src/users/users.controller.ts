import {
  Body,
  Controller,
  Delete,
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
import { Throttle } from '@nestjs/throttler';
import { Role, type User } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import type { AuthenticatedUser } from '../auth/jwt-payload';
import type { SignedUploadParams } from '../files/cloudinary.service';
import { UsersService } from './users.service';
import { ListUsersDto } from './dto/list-users.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { SetAvatarDto } from './dto/set-avatar.dto';
import { AvatarResponseDto } from './dto/avatar-response.dto';
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
    avatarPublicId: user.avatarPublicId,
    title: user.title ?? null,
    bio: user.bio ?? null,
    skills: parseSkills(user.skills),
    createdAt: user.createdAt,
  };
}

function toPublicUserResponse(user: User): UserResponseDto {
  // Hide email + avatarPublicId (admin-internal, không cần public expose)
  return { ...toUserResponse(user), email: null, avatarPublicId: null };
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

  // ── FR-11.7 Avatar upload (declare TRƯỚC `:id` routes để Nest match đúng `me`) ──

  @Post('me/avatar/sign')
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Issue Cloudinary signed params cho self avatar upload (FR-11.7)' })
  signAvatar(@CurrentUser() requester: AuthenticatedUser): SignedUploadParams {
    return this.users.getAvatarSignParams(requester.sub);
  }

  @Patch('me/avatar')
  @ApiOperation({
    summary: 'Save avatar sau khi FE upload Cloudinary success (FR-11.7) — cleanup avatar cũ',
  })
  @ApiResponse({ status: 200, type: AvatarResponseDto })
  async setAvatar(
    @CurrentUser() requester: AuthenticatedUser,
    @Body() dto: SetAvatarDto,
  ): Promise<AvatarResponseDto> {
    const user = await this.users.setAvatar(requester.sub, dto.url, dto.publicId);
    return { avatarUrl: user.avatarUrl, avatarPublicId: user.avatarPublicId };
  }

  @Delete('me/avatar')
  @ApiOperation({ summary: 'Remove avatar (FR-11.7) — Cloudinary destroy + null fields' })
  @ApiResponse({ status: 200, type: AvatarResponseDto })
  async removeAvatar(@CurrentUser() requester: AuthenticatedUser): Promise<AvatarResponseDto> {
    const user = await this.users.removeAvatar(requester.sub);
    return { avatarUrl: user.avatarUrl, avatarPublicId: user.avatarPublicId };
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

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
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import type { AuthenticatedUser } from '../auth/jwt-payload';
import { UsersService } from './users.service';
import { ListUsersDto } from './dto/list-users.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PaginatedUsersDto, UserResponseDto } from './dto/user-response.dto';

function toUserResponse(user: User): UserResponseDto {
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    role: user.role,
    avatarUrl: user.avatarUrl,
    createdAt: user.createdAt,
  };
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

  @Get(':id')
  @ApiOperation({ summary: 'Get user by id (admin hoặc self)' })
  @ApiResponse({ status: 200, type: UserResponseDto })
  async get(
    @Param('id') id: string,
    @CurrentUser() requester: AuthenticatedUser,
  ): Promise<UserResponseDto> {
    const isAdmin = requester.role === Role.ADMIN;
    const isSelf = requester.sub === id;
    if (!isAdmin && !isSelf) {
      // Treat as not-found for privacy
      const u = await this.users.findById(id);
      return toUserResponse({ ...u, email: null }); // hide email cho non-admin/non-self
    }
    return toUserResponse(await this.users.findById(id));
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update user (admin hoặc self) — email, avatarUrl' })
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

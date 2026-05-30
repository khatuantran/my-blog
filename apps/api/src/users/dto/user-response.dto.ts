import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Role } from '@prisma/client';

export type Skill = { name: string; color: string };

export class UserResponseDto {
  @ApiProperty({ example: 'cmpa14i8t000010ldmv5j5att' })
  id!: string;

  @ApiProperty({ example: 'kha' })
  username!: string;

  @ApiProperty({ example: 'kha@example.com', nullable: true })
  email!: string | null;

  @ApiProperty({ enum: Role, example: Role.USER })
  role!: Role;

  @ApiProperty({ example: 'https://...cloudinary.../avatar.jpg', nullable: true })
  avatarUrl!: string | null;

  @ApiPropertyOptional({
    example: 'avatars/u-alice-1234567890',
    nullable: true,
    description: 'FR-11.7 — Cloudinary publicId (chỉ admin/self thấy)',
  })
  avatarPublicId?: string | null;

  @ApiPropertyOptional({ example: 'Full-stack Developer', nullable: true })
  title?: string | null;

  @ApiPropertyOptional({ example: 'Bio markdown...', nullable: true })
  bio?: string | null;

  @ApiPropertyOptional({
    description: 'Skills array `[{ name, color }]`',
    example: [{ name: 'TypeScript', color: '#7DCFFF' }],
  })
  skills?: Skill[];

  // FR-11.8 contact + identity fields (5 optional nullable)
  @ApiPropertyOptional({ example: 'Kha Tran', nullable: true })
  name?: string | null;

  @ApiPropertyOptional({ example: 'Ho Chi Minh City', nullable: true })
  location?: string | null;

  @ApiPropertyOptional({ example: 1995, nullable: true })
  bornYear?: number | null;

  @ApiPropertyOptional({ example: 'khatran', nullable: true })
  github?: string | null;

  @ApiPropertyOptional({ example: 'https://kha.dev', nullable: true })
  website?: string | null;

  @ApiProperty({ example: '2026-05-17T16:59:32.000Z' })
  createdAt!: Date;
}

export class PaginatedUsersDto {
  @ApiProperty({ type: [UserResponseDto] })
  items!: UserResponseDto[];

  @ApiProperty({ example: 42 })
  total!: number;

  @ApiProperty({ example: 1 })
  page!: number;

  @ApiProperty({ example: 20 })
  limit!: number;
}

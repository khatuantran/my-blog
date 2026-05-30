import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Role } from '@prisma/client';

type Skill = { name: string; color: string };

// FR-11.8 — Full profile shape (was 6 fields, expand 15) cho FE useAuth() consume
// profile data 1 query thay vì phải fetch /users/by-username riêng cho viewer-self case.
export class AuthUserDto {
  @ApiProperty({ example: 'cmpa14i8t000010ldmv5j5att' })
  id!: string;

  @ApiProperty({ example: 'kha' })
  username!: string;

  @ApiProperty({ example: 'kha@example.com', nullable: true })
  email!: string | null;

  @ApiProperty({ enum: Role, example: Role.ADMIN })
  role!: Role;

  @ApiProperty({ example: 'https://...cloudinary.../avatar.jpg', nullable: true })
  avatarUrl!: string | null;

  @ApiPropertyOptional({ example: 'avatars/u-alice-1234', nullable: true })
  avatarPublicId?: string | null;

  @ApiPropertyOptional({ example: 'Full-stack Developer', nullable: true })
  title?: string | null;

  @ApiPropertyOptional({ example: 'Bio markdown...', nullable: true })
  bio?: string | null;

  @ApiPropertyOptional({
    description: 'Skills `[{ name, color }]`',
    example: [{ name: 'TypeScript', color: '#7DCFFF' }],
  })
  skills?: Skill[];

  // FR-11.8 contact fields
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

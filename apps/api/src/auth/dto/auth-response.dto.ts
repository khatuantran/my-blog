import { ApiProperty } from '@nestjs/swagger';
import { Role } from '@prisma/client';

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

  @ApiProperty({ example: '2026-05-17T16:59:32.000Z' })
  createdAt!: Date;
}

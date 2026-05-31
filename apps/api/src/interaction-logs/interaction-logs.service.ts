import { createHash } from 'node:crypto';
import { Injectable, Logger } from '@nestjs/common';
import { InteractionAction, InteractionTargetType, Prisma, Role } from '@prisma/client';
import { PrismaService } from 'nestjs-prisma';
import { UAParser } from 'ua-parser-js';
import type { ClientInfo } from '../common/decorators/client-info.decorator';

export type LogInteractionInput = {
  action: InteractionAction;
  targetType: InteractionTargetType;
  targetId: string;
  postId?: string | null;
  actorUserId?: string | null;
  actorRole?: Role | null;
  anonymousId?: string | null;
  client?: ClientInfo;
  metadata?: Prisma.InputJsonValue;
};

@Injectable()
export class InteractionLogService {
  private readonly logger = new Logger(InteractionLogService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Best-effort trace log (FR-18). KHÔNG throw — không block hành động gốc.
   * Bỏ qua khi actor là ADMIN (chỉ trace non-admin: anon + USER).
   */
  async log(input: LogInteractionInput): Promise<void> {
    if (input.actorRole === Role.ADMIN) return; // FR-18.1: không trace admin

    try {
      const client = input.client ?? {};
      const ua = client.userAgent ? new UAParser(client.userAgent).getResult() : null;
      await this.prisma.interactionLog.create({
        data: {
          action: input.action,
          targetType: input.targetType,
          targetId: input.targetId,
          postId: input.postId ?? null,
          actorUserId: input.actorUserId ?? null,
          actorRole: input.actorRole ?? null,
          anonymousId: input.anonymousId ?? null,
          ip: client.ip ?? null,
          userAgent: client.userAgent ?? null,
          browser: ua ? fmt(ua.browser.name, ua.browser.version) : null,
          os: ua ? fmt(ua.os.name, ua.os.version) : null,
          device: ua ? (ua.device.type ?? 'desktop') : null,
          acceptLang: client.acceptLanguage ?? null,
          referer: client.referer ?? null,
          fingerprint: fingerprint(client),
          metadata: input.metadata ?? Prisma.JsonNull,
        },
      });
    } catch (err) {
      this.logger.warn(
        `InteractionLog insert failed (best-effort skip): ${(err as Error).message}`,
      );
    }
  }
}

function fmt(name?: string, version?: string): string | null {
  if (!name) return null;
  return version ? `${name} ${version}` : name;
}

/** sha256(ip+ua+acceptLang) cắt 16 — gom hành động cùng thiết bị kể cả khi xoá cookie anon_id. */
function fingerprint(client: ClientInfo): string | null {
  const basis = `${client.ip ?? ''}|${client.userAgent ?? ''}|${client.acceptLanguage ?? ''}`;
  if (basis === '||') return null;
  return createHash('sha256').update(basis).digest('hex').slice(0, 16);
}

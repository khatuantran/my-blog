import { REACTION_TYPES, type ReactionType, type TotalReactionCounts } from '@/types/api';

export type ReactionConfig = {
  type: ReactionType;
  emoji: string;
  label: string;
  color: string;
};

// Spec: DESIGN_SYSTEM.md > ReactionPicker (FR-16).
// Colors map vào CSS var tokens — dùng để glow/highlight active reaction.
export const REACTION_CONFIG: Record<ReactionType, ReactionConfig> = {
  LIKE: { type: 'LIKE', emoji: '👍', label: 'Like', color: 'var(--cyan)' },
  LOVE: { type: 'LOVE', emoji: '❤️', label: 'Love', color: 'var(--red)' },
  HAHA: { type: 'HAHA', emoji: '😆', label: 'Haha', color: 'var(--yel)' },
  WOW: { type: 'WOW', emoji: '😮', label: 'Wow', color: 'var(--ora)' },
  SAD: { type: 'SAD', emoji: '😢', label: 'Sad', color: 'var(--blu)' },
  ANGRY: { type: 'ANGRY', emoji: '😡', label: 'Angry', color: 'var(--red)' },
};

export const REACTION_LIST: ReactionConfig[] = REACTION_TYPES.map((t) => REACTION_CONFIG[t]);

export function emptyReactionCounts(): TotalReactionCounts {
  return REACTION_TYPES.reduce<TotalReactionCounts>((acc, t) => {
    acc[t] = 0;
    return acc;
  }, {} as TotalReactionCounts);
}

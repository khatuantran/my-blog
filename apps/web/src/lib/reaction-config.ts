import { REACTION_TYPES, type ReactionType, type TotalReactionCounts } from '@/types/api';

export type ReactionConfig = {
  type: ReactionType;
  label: string;
  /** Hex color literal — fed directly to SVG `stroke`/`fill` attrs in ReactionIcon. */
  color: string;
};

// Spec: DESIGN_SYSTEM.md > ReactionPicker (FR-16) + design-file/MyBlog Feed.html L718-723.
// T-357: drop `emoji` field — line-art SVG via ReactionIcon component supersedes emoji.
// Colors switch from CSS var tokens → hex literals because SVG stroke/fill cannot resolve `var()`
// in <svg> attributes (jsdom + Safari both flake on it). Hex values match design-file palette.
export const REACTION_CONFIG: Record<ReactionType, ReactionConfig> = {
  LIKE: { type: 'LIKE', label: 'Like', color: '#7DCFFF' }, // blu
  LOVE: { type: 'LOVE', label: 'Love', color: '#FF6E96' }, // mag
  HAHA: { type: 'HAHA', label: 'Haha', color: '#E0AF68' }, // yel
  WOW: { type: 'WOW', label: 'Wow', color: '#BB9AF7' }, // pur
  SAD: { type: 'SAD', label: 'Sad', color: '#7DCFFF' }, // blu
  ANGRY: { type: 'ANGRY', label: 'Angry', color: '#F7768E' }, // red
};

export const REACTION_LIST: ReactionConfig[] = REACTION_TYPES.map((t) => REACTION_CONFIG[t]);

export function emptyReactionCounts(): TotalReactionCounts {
  return REACTION_TYPES.reduce<TotalReactionCounts>((acc, t) => {
    acc[t] = 0;
    return acc;
  }, {} as TotalReactionCounts);
}

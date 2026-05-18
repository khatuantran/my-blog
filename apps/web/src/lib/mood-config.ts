// Mood configuration — emoji + color + label cho 7 mood values.
// Sync với BE enum `Mood` trong apps/api/prisma/schema.prisma.
// Port từ design-file/myblog-components.jsx:43-51.

export type Mood = 'HAPPY' | 'EXCITED' | 'THOUGHTFUL' | 'CALM' | 'SAD' | 'GRATEFUL' | 'ANGRY';

export type MoodMeta = {
  emoji: string;
  color: string;
  label: string;
};

export const MOOD_CFG: Record<Mood, MoodMeta> = {
  HAPPY: { emoji: '😊', color: '#FFD93D', label: 'happy' },
  EXCITED: { emoji: '⚡', color: '#FF9E64', label: 'excited' },
  THOUGHTFUL: { emoji: '💭', color: '#BB9AF7', label: 'thoughtful' },
  CALM: { emoji: '😌', color: '#7DCFFF', label: 'calm' },
  SAD: { emoji: '😢', color: '#6BCFFF', label: 'sad' },
  GRATEFUL: { emoji: '🙏', color: '#9ECE6A', label: 'grateful' },
  ANGRY: { emoji: '😠', color: '#F7768E', label: 'angry' },
};

export const MOOD_KEYS: readonly Mood[] = [
  'HAPPY',
  'EXCITED',
  'THOUGHTFUL',
  'CALM',
  'SAD',
  'GRATEFUL',
  'ANGRY',
] as const;

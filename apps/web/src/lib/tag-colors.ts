// 7-color cyberpunk palette mirror BE TAG_COLORS (apps/api/src/tags/tags.service.ts).
// Sync giữ identical để FE preview match server color khi upsert.

export const TAG_COLORS = [
  '#00FFE5', // cyan
  '#FF6E96', // mag
  '#BB9AF7', // purple
  '#9ECE6A', // green
  '#E0AF68', // yellow
  '#FF9E64', // orange
  '#7DCFFF', // blue
] as const;

// 8-accent palette alias (= --accents) for TagModal NEON_COLORS color picker.
// TAG_COLORS (7) ∪ red = NEON_COLORS (8).
export const NEON_COLORS = [
  '#00FFE5', // cyan
  '#FF6E96', // mag
  '#BB9AF7', // pur
  '#9ECE6A', // grn
  '#E0AF68', // yel
  '#FF9E64', // ora
  '#7DCFFF', // blu
  '#F7768E', // red
] as const;

export function pickTagColor(index: number): string {
  return TAG_COLORS[index % TAG_COLORS.length];
}

// Normalize name: lowercase + strip leading #, max 30 chars.
export function normalizeTagName(raw: string): string {
  return raw.toLowerCase().replace(/^#+/, '').trim().slice(0, 30);
}

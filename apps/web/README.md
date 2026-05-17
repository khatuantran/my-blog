# `@myblog/web` — Frontend

Vite + React 19 + React Router v7 + TanStack Query + Zustand + Tailwind + shadcn/ui.

## Quick Start

```bash
# Từ root repo
pnpm install
cp apps/web/.env.example apps/web/.env.local   # set VITE_API_URL, VITE_WS_URL
pnpm --filter web dev                           # → http://localhost:5173
```

## Scripts

| Script | Mô tả |
|---|---|
| `pnpm --filter web dev` | Vite dev server (HMR) |
| `pnpm --filter web build` | TS typecheck + Vite production build |
| `pnpm --filter web preview` | Serve build/ output locally |
| `pnpm --filter web test` | Vitest run |
| `pnpm --filter web test:ui` | Vitest UI |
| `pnpm --filter web typecheck` | `tsc --noEmit` |

## Structure

Xem [docs/ARCHITECTURE.md > apps/web components](../../docs/ARCHITECTURE.md). Conventions: [docs/CODING_CONVENTION.md §Frontend](../../docs/CODING_CONVENTION.md). Tokens & components: [docs/DESIGN_SYSTEM.md](../../docs/DESIGN_SYSTEM.md).

## shadcn/ui

Init xong (`components.json` + `src/lib/utils.ts`). Add component khi cần:

```bash
pnpm --filter web dlx shadcn@latest add button
# → tạo apps/web/src/components/ui/button.tsx
```

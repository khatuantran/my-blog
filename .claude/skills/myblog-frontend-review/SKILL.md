---
name: myblog-frontend-review
description: Review chuyên sâu code frontend (apps/web, React 19) trong MyBlog project. Kích hoạt sau mỗi lần viết/sửa code FE — khi user nói "review frontend", "xong FE", "check UI", "done component", hoặc khi Claude vừa viết/sửa file trong apps/web/ (component .tsx, hook, store, service, validator, css). Kiểm tra 2 tầng: (1) Convention — TypeScript, naming, enums, logging, imports, component rules; (2) Deep — React patterns, TanStack Query, Zustand state, react-hook-form, routing, design token, performance, accessibility. Không bỏ qua kể cả thay đổi nhỏ.
---

# MyBlog Frontend Deep Review

Review code FE (`apps/web/`) theo `docs/CODING_CONVENTION.md` (Universal + Frontend) + `docs/DESIGN_SYSTEM.md` + `docs/UI_DESIGN.md`.
Chạy SAU khi code FE xong, TRƯỚC khi commit.

---

## Bước 1: Xác định phạm vi

```bash
git diff --name-only HEAD -- apps/web/
git diff --name-only --cached -- apps/web/
```

Phân loại file: component (`.tsx`) / hook / store / service (api, ws) / validator / page / route / css.
Nếu không có file FE → "Không có thay đổi frontend."

---

## Tầng 1 — Convention Checks

### TypeScript & Naming

- [ ] Không `any` (dùng `unknown` + narrow)
- [ ] Public function/component có type; prefer `type` over `interface`
- [ ] File component `PascalCase.tsx`; hook/service/util `camelCase.ts`; hook bắt đầu bằng `use`
- [ ] Component `PascalCase`, var/function `camelCase`, constant `UPPER_SNAKE`

### Enums

- [ ] Không string literal union làm enum ảo
- [ ] Business domain enum → mirror từ `@/types/api` (gen từ openapi) + `z.nativeEnum`
- [ ] FE-only UI state enum → `as const` object + derived type (KHÔNG raw union)

### Logging

- [ ] Không `console.*` — dùng `logger` từ `@/lib/logger` (loglevel)

### Imports

- [ ] Thứ tự: external → `@/` absolute → relative → type-only
- [ ] Dùng alias `@/*` thay relative path dài

### Component basics

- [ ] Function-based (không class component)
- [ ] Named export (không default export)
- [ ] Component file < 200 dòng — dài hơn thì gợi ý tách

---

## Tầng 2 — Deep Review

### React Patterns

- [ ] Không gọi hook có điều kiện / trong loop (rules of hooks)
- [ ] `useEffect` có dependency array đúng — không thiếu/thừa deps
- [ ] Cleanup function trong effect khi subscribe/timer/listener
- [ ] Không derive state thừa vào `useState` (tính trực tiếp khi render được)
- [ ] `key` ổn định khi render list (không dùng index nếu list reorder)
- [ ] Memoize hợp lý (`useMemo`/`useCallback`) cho expensive compute / referential stability — không lạm dụng

### TanStack Query (server state)

- [ ] Query key đúng convention: `['posts']`, `['post', id]`, `['comments', postId]`, `['admin', 'stats']`
- [ ] `staleTime` hợp lý: list 30s, static (tags) 5min, user-specific 1min
- [ ] Mutation invalidate key cụ thể — KHÔNG `invalidateQueries()` rộng
- [ ] Optimistic update cho like/save/comment delete (UX critical)
- [ ] Mọi data từ BE qua TanStack Query — không fetch thủ công trong effect

### State Management

- [ ] Server state → TanStack Query; Form → react-hook-form + zod; Shared UI → Zustand; Local → useState
- [ ] Zustand selector pattern: `useStore(s => s.field)` — KHÔNG destructure cả store (gây re-render)
- [ ] 1 store per domain (`useAuthStore`, `useUIStore`) — không bloated single store

### Form

- [ ] `useForm<T>({ resolver: zodResolver(schema) })`
- [ ] Schema ở `src/lib/validators.ts` — reuse, không inline rải rác
- [ ] Error display inline below input (design system pattern)

### Routing (React Router v7)

- [ ] Route config ở `src/routes.tsx` (centralized)
- [ ] Lazy load per page: `lazy: () => import('./pages/...')`
- [ ] Protected route wrap `<ProtectedRoute requireAdmin>`
- [ ] Navigate qua `useNavigate()` / `<Link>` — không `window.location`

### Design Token & CSS (quan trọng)

- [ ] KHÔNG hardcode color/spacing — dùng Tailwind token class hoặc `var(--token)`
- [ ] Component/token mới phải có spec trong `docs/DESIGN_SYSTEM.md` trước khi code
- [ ] shadcn/ui customize qua CSS variables override — không sửa trực tiếp primitive
- [ ] Custom CSS chỉ cho keyframes phức tạp / complex selector

### Accessibility (a11y)

- [ ] Interactive element keyboard-accessible (button thật, không `<div onClick>`)
- [ ] `<img>` có `alt`; icon-only button có `aria-label`
- [ ] Form input có `<label>` liên kết
- [ ] Focus management cho modal/overlay (command palette, dialog)
- [ ] Element cần E2E target có `data-testid="<kebab-case>"`

### Performance

- [ ] Lazy load per route (React.lazy + Suspense)
- [ ] Heavy lib (markdown, syntax highlight) dynamic import
- [ ] `<img loading="lazy">` hoặc Cloudinary `w_auto,f_auto`
- [ ] Lighthouse perf + a11y ≥ 85 cho page public

---

## Bước cuối: Output Report

```
## 🎨 Frontend Deep Review

**Files**: [N] — [component/hook/store/...]

### ✅ Passed
- [convention + deep checks passed, ngắn gọn]

### ❌ Violations
| # | Tầng | Rule | File:Line | Detail | Cách fix |
|---|------|------|-----------|--------|---------|
| 1 | Deep/Zustand | Destructure cả store | TopBar.tsx:12 | const { user, theme } = useStore() gây re-render | Dùng selector useStore(s => s.user) |
| 2 | Deep/CSS | Hardcode color | PostCard.tsx:30 | className="text-[#00ffff]" | Dùng token var(--cyan) / class token |

### ♿ Accessibility
- [pass/fail list]

### ⚡ Performance
- [pass/fail list]

### 📌 Action items trước commit
1. Fix [violation]: ...
2. Thêm DESIGN_SYSTEM.md spec (nếu component mới)
```

Nếu pass: `✅ Frontend review passed — N files, convention + deep checks OK. Safe to commit.`

---

## Tham chiếu

- `docs/CODING_CONVENTION.md` — Universal (6-227) + Frontend (230-336)
- `docs/DESIGN_SYSTEM.md` — tokens + component primitives
- `docs/UI_DESIGN.md` — screen wireframe + state machine

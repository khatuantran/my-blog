---
name: myblog-commit-helper
description: Draft commit message đúng Conventional Commits cho MyBlog project — tự suy ra type(scope) từ flow + file changed, kèm footer Refs/Fixes. Kích hoạt khi user nói "commit", "tạo commit", "viết commit message", "draft commit", hoặc khi vừa hoàn thành task và chuẩn bị commit. Suy luận type từ flow (F1→feat, F3→fix, F5→refactor...), scope từ path file changed, và footer (Refs: T-XXX / Fixes: BUG-XXX). Không tự commit khi chưa được user xác nhận message.
---

# MyBlog Commit Helper

Draft commit message. **Format rule (subject < 72, lowercase, no period; body=WHY; footer; language) là SOURCE OF TRUTH ở `CLAUDE.md > Commit Convention`** (auto-load) — không lặp lại ở đây. Skill này lo phần suy luận type/scope + workflow.

---

## Bước 1: Thu thập context

```bash
git status
git diff --cached --stat
git diff --stat
git log --oneline -5
```

Chưa stage gì → gợi ý file nên add (tránh `git add -A` ôm nhầm secret/file lớn).

## Bước 2: Suy `type` từ flow (heuristic — không có sẵn trong CLAUDE.md)

| Flow                | Type                                                   |
| ------------------- | ------------------------------------------------------ |
| F1 New Feature      | `feat`                                                 |
| F2 Amend FR         | `feat` (thêm behavior) / `refactor` (code tương đương) |
| F3 Bug Fix          | `fix`                                                  |
| F4 Hotfix           | `fix(hotfix)`                                          |
| F5 Refactor         | `refactor`                                             |
| F6 Docs             | `docs`                                                 |
| F7 Chore            | `chore`                                                |
| chỉ test            | `test`                                                 |
| chỉ format          | `style`                                                |
| tối ưu perf đo được | `perf`                                                 |

## Bước 3: Suy `scope` từ path file changed

| Path chứa                        | Scope     |
| -------------------------------- | --------- |
| `.../auth/`                      | `auth`    |
| `.../posts/`                     | `post`    |
| `.../comments/`                  | `comment` |
| `.../likes/`                     | `like`    |
| `.../files/`, upload             | `upload`  |
| feed/listing                     | `feed`    |
| `.../admin/`                     | `admin`   |
| `prisma/`, schema, migration     | `db`      |
| `apps/api/` nhiều module         | `api`     |
| `.../realtime/`, gateway, socket | `ws`      |
| `apps/web/` nhiều vùng           | `web`     |
| root, Docker, turbo, CI, deploy  | `infra`   |

Nhiều scope độc lập → `feat(api,post):`. Quá rộng → bỏ scope.

## Bước 4: Footer

- feat/refactor/chore/docs → `Refs: T-XXX` (+ `UC-YY` nếu có)
- fix → `Fixes: BUG-XXX`
- Lấy T-XXX/BUG-XXX từ task DOING trong TASKS.md; không rõ → hỏi user.

## Bước 5: Output + xác nhận

Show message block cho user duyệt TRƯỚC khi commit. **1 task = 1 commit** (nhiều task logic khác nhau → gợi ý tách). Sau khi duyệt, commit qua HEREDOC:

```bash
git commit -m "$(cat <<'EOF'
feat(post): thêm CRUD bài viết cho admin

Admin cần quản lý bài trực tiếp thay vì sửa DB tay.

Refs: T-105, UC-01
EOF
)"
```

**KHÔNG tự commit khi user chưa duyệt. KHÔNG `--no-verify`.** Pre-commit hook fail → fix root cause, tạo commit MỚI (không amend).

---

## Examples

1. F1 BE, thêm controller+DTO, T-105 → `feat(post): add POST /posts endpoint with file attachment` + `Refs: T-105`
2. F3 FE, sửa useAuth.ts, BUG-012 → `fix(auth): sửa session expire sai timezone` + `Fixes: BUG-012`
3. F6 chỉ sửa API_CONTRACT.md → `docs(api): cập nhật API_CONTRACT với WebSocket events`
4. F7 bump deps → `chore(deps): bump nestjs 10.3 → 10.4`

---

## Tham chiếu

- `CLAUDE.md > Commit Convention` — full rule type/scope/subject/footer/language (source of truth)
- `CLAUDE.md > Branching Strategy` — trunk-based
- `docs/TASKS.md` (T-XXX) | `docs/BUGS.md` (BUG-XXX)

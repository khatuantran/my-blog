---
name: myblog-contract-sync
description: Đồng bộ OpenAPI contract sau khi sửa BE controller/DTO trong MyBlog project. Kích hoạt SAU khi vừa thêm/sửa file controller, DTO, hoặc endpoint trong apps/api/ — khi user nói "xong endpoint", "sửa DTO", "thêm API", "sync contract", "openapi", hoặc trước khi commit BE có touch controller/DTO. Chạy pnpm openapi:sync, verify drift openapi.yaml + api.generated.ts, nhắc update apps/web/src/types/api.ts thủ công cho endpoint mới. Đây là bước hay quên — CI có drift check sẽ fail PR nếu miss.
---

# MyBlog Contract Sync

Skill này đảm bảo OpenAPI contract đồng bộ sau khi đổi BE controller/DTO.
Lý do tồn tại: CI chạy `git diff --exit-code` trên `openapi.yaml` + `api.generated.ts` → quên sync = **fail PR**.

---

## Bước 1: Xác định có cần sync không

```bash
git diff --name-only HEAD -- apps/api/
git diff --name-only --cached -- apps/api/
```

**Cần sync nếu** file changed gồm:

- `*.controller.ts` (thêm/sửa/xóa endpoint, đổi route, đổi decorator `@Api*`)
- `dto/*.dto.ts` (thêm/sửa field, đổi validator, đổi `@ApiProperty`)
- `*.entity.ts` hoặc response shape thay đổi

**Không cần** nếu chỉ sửa service logic, guard nội bộ, test → bỏ qua, báo "Không touch contract, skip sync."

---

## Bước 2: Chạy openapi:sync

```bash
pnpm openapi:sync
```

Lệnh này cập nhật:

- `docs/contracts/openapi.yaml` — source of truth contract (gen từ NestJS `@nestjs/swagger`)
- `apps/web/src/types/api.generated.ts` — FE reference types (chưa import trực tiếp tới khi T-302 cutover)

Nếu lệnh fail → đọc lỗi (thường do decorator Swagger thiếu/sai trên DTO/controller). Fix decorator rồi chạy lại. **KHÔNG sửa tay `openapi.yaml`** — chỉ regenerate.

---

## Bước 3: Verify drift (mô phỏng CI check)

```bash
git diff --stat -- docs/contracts/openapi.yaml apps/web/src/types/api.generated.ts
```

- Có thay đổi → đúng như mong đợi, stage cả 2 file cùng commit BE.
- **Không thay đổi gì** dù vừa sửa controller/DTO → nghi vấn: decorator Swagger chưa đúng (endpoint không xuất hiện trong spec). Kiểm tra `@ApiTags / @ApiOperation / @ApiResponse / @ApiBody / @ApiProperty`.

CI sẽ chạy `git diff --exit-code` trên 2 file này — nếu local chưa stage = PR fail. Đảm bảo cả 2 nằm trong commit.

---

## Bước 4: Update api.ts thủ công (cho endpoint MỚI)

`apps/web/src/types/api.ts` là **type FE đang dùng thật** (hand-typed, tới khi T-302 cutover sang generated). Generated file chưa được import.

→ Nếu vừa thêm **endpoint mới** hoặc đổi shape request/response:

- [ ] Thêm/sửa type tương ứng trong `apps/web/src/types/api.ts` thủ công
- [ ] Khớp với body shape + response fields vừa định nghĩa ở DTO

Chỉ sửa service nội bộ (không đổi shape) → không cần đụng api.ts.

---

## Bước 5: Đồng bộ doc liên quan

- [ ] `docs/API_CONTRACT.md` — endpoint mới/sửa có Notes đầy đủ (body shape + response fields + status codes, KHÔNG generic)? (skill docs-review check kỹ hơn)

---

## Output Report

```
🔄 Contract Sync
- Touch contract : YES (controller/DTO) / NO (skip)
- openapi:sync   : ✅ chạy OK / ❌ lỗi <decorator>
- Drift          : openapi.yaml [changed/none], api.generated.ts [changed/none]
- api.ts thủ công: cần update [endpoint X] / không cần
- Staged         : đã add cả 2 generated file vào commit?
- ⚠️ Nhắc        : commit kèm 2 file generated nếu không CI fail drift check
```

Nếu không touch contract: `✅ Không đổi controller/DTO — không cần sync.`

---

## Tham chiếu

- `docs/CODING_CONVENTION.md > OpenAPI contract sync` (lines ~220-226) — quy tắc đầy đủ
- `docs/CODING_CONVENTION.md > Swagger / OpenAPI` (BE section) — decorator bắt buộc
- `docs/API_CONTRACT.md` — narrative + link `contracts/openapi.yaml`
- T-302 — task cutover FE sang generated types (sau đó bỏ bước 4)

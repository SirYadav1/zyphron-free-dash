# Bug Fix Report — Server Creation & Egg Selection
**Date:** 2026-06-20  
**Module:** ServicesView.vue, servers.service.ts  
**Severity:** High (blocked server creation for neutral-egg products)

---

## 🐛 Bugs Fixed

### BUG-001: "Product is not properly configured" error for neutral egg products
**Reporter:** User (screenshot)  
**Severity:** High  
**Status:** ✅ Fixed

**Description:**  
When a product has `egg_id = NULL` (neutral egg — meaning user should choose the software), clicking "Deploy Server" threw:  
```
Product is not properly configured. Please contact support.
```

**Root Cause:**  
In `servers.service.ts` line 247, the validation was:
```typescript
if (!productNestId || !productEggId) {
  throw new BadRequestException('Product is not properly configured...');
}
```
This rejected products where `egg_id` was null, but null `egg_id` is intentional — it means "neutral egg" (user selects at deploy time).

**Fix:**  
- Changed validation to only require `nest_id` (egg can be null for neutral products)
- Added post-resolution validation: if eggId is still null after user selection, throw clear error
- File: `src/servers/servers.service.ts`

---

### BUG-002: All eggs shown as selected (single-select broken)
**Reporter:** User (screenshot)  
**Severity:** High  
**Status:** ✅ Fixed

**Description:**  
In the egg selection step, ALL eggs appeared selected with blue checkmarks simultaneously. User could not distinguish which egg was actually selected.

**Root Cause:**  
API returns eggs in Pterodactyl format:
```json
{ "id": null, "attributes": { "id": 1, "name": "Paper" } }
```
Frontend compared `selectedEgg?.id === egg.id` — both were `undefined` (since top-level `id` is null), so `undefined === undefined` = `true` for ALL eggs.

**Fix:**  
- Changed all egg ID comparisons to use `egg.attributes?.id` instead of `egg.id`
- Fixed `:key` binding to use `egg.attributes?.id || egg.id`
- Fixed `deployServer()` to pass `selectedEgg.value.attributes?.id || selectedEgg.value.id`
- File: `client/views/ServicesView.vue`

---

## 📋 Changelog

| # | Change | File | Type |
|---|--------|------|------|
| 1 | Removed `!productEggId` from validation — neutral eggs now allowed | `servers.service.ts` | Bug Fix |
| 2 | Added egg resolution validation after user selection | `servers.service.ts` | Enhancement |
| 3 | Fixed egg selection comparison to use `attributes.id` | `ServicesView.vue` | Bug Fix |
| 4 | Fixed egg `:key` binding for Pterodactyl API format | `ServicesView.vue` | Bug Fix |
| 5 | Fixed deployServer eggId extraction from nested attributes | `ServicesView.vue` | Bug Fix |

---

## 🧪 Test Scenarios

| Scenario | Expected | Status |
|----------|----------|--------|
| Product with neutral egg (egg_id=null) | Shows egg selection, deploys successfully | ✅ |
| Product with specific egg | Auto-selects egg, skips selection step | ✅ |
| Egg selection — click one egg | Only that egg highlighted, others unselected | ✅ |
| Deploy without selecting egg | Error: "Please select a software option" | ✅ |
| Deploy with selected egg | Server created successfully | ✅ |

---

## 📸 Evidence
- Screenshot showing all eggs selected: `/root/.hermes/image_cache/img_6ed9a7a5352a.jpg`
- Screenshot showing "Product not properly configured" error: same image (top banner)

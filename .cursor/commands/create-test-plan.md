## Cursor Command: `/create-test-plan`

**Purpose:** Create a comprehensive test plan document as a markdown file. The test plan follows a structured format for QA testing.

### Usage
```
/create-test-plan [feature-name] [description]
```

### Behavior

When user uses `/create-test-plan` command:

1. **Analyze the request**: Understand what feature/functionality needs to be tested
2. **Gather context (DB staging)**: **Jalankan query** ke database via MCP **postgres-proconnect-stg** (atau `user-postgres`) — read-only — untuk: table structures, relationships, constraints, indexes, dan existing data patterns yang relevan. Gunakan hasil ini untuk mengisi section **Data Context (from DB)** dan **Pre-run verification** di test plan (ID/nama master data, nilai enum, contoh row, ekspektasi per query).
3. **Create a markdown file**: Generate a detailed test plan document yang **selalu menyertakan** section Pre-run verification dengan query SQL yang bisa dijalankan lagi saat `/qa-test` untuk konteks staging.
4. **File location**: Save to `docs/testing/` directory or project root if directory doesn't exist
5. **File naming**: Use format `[feature-name]-test-plan.md` (e.g., `user-authentication-test-plan.md`)
6. **Test plan structure**: Include all necessary sections following the standard format

### Test Plan Format

The generated markdown file should follow this structure:

```markdown
# [Feature Name] - Test Plan

## Overview
[Brief description of what needs to be tested]
**Status:** [PENDING/IN PROGRESS/COMPLETED]

---

## Prerequisites
- ✅ API server running on `localhost:3010`
- ✅ Valid admin/sysadmin token (Bearer token)
- ✅ [Other prerequisites specific to the feature]
- ✅ Redis server running (if applicable)
- ✅ All migrations run successfully

## Data Context (from DB – staging)

Konteks data dari database (query via MCP postgres-proconnect-stg) agar test plan konsisten dengan data aktual. Diisi berdasarkan hasil **Gather context** saat create.

- **Nilai enum / domain** (jika relevan): e.g. kolom X boleh nilai A, B, NULL.
- **Master data relevan**: tabel, ID, nama (e.g. school_id, major_id, license_id yang dipakai di TC).
- **Relasi / constraint**: singkat saja (e.g. unique index apa, FK ke mana).

---

## Pre-run verification (jalankan di DB staging sebelum execute TC)

Query berikut **wajib dijalankan** oleh siapa pun yang run test (e.g. `/qa-test`) via MCP postgres-proconnect-stg. Setiap query harus punya ekspektasi jelas.

```sql
-- 1. [Deskripsi singkat]
SELECT ... FROM ... WHERE ...;
-- Expect: [e.g. 1 row / 2 rows / is_nullable = YES]

-- 2. [Deskripsi singkat]
SELECT ... FROM ... WHERE ...;
-- Expect: ...

-- [3–6 query lagi sesuai feature: cek master data ada, relasi ada, constraint/index ada]
```

Jika ada query yang tidak memenuhi ekspektasi, env belum siap; selesaikan data/schema dulu sebelum jalankan TC.

---

## Test Data Setup
- **Test User ID**: Use consistent user_id for all test data modifications
- **[Other test data requirements]**

---

## Test Cases

### Phase X: [Phase Name]

#### TC-X.X: [Test Case Name]
**Hit:** `METHOD /endpoint`  
**Code Ref:** `path/to/file.ts` (line ~XXX) (optional)

**Setup:**
- [Setup steps if needed]

**Request:**
```bash
METHOD /endpoint
Headers: ...
Body: ...
```

**Expected:**
- ✅ Status: `200 OK` (or appropriate status)
- ✅ Response contains [expected data]
- ✅ [Other expected behaviors]

**Verify:**
- API response matches expected
- Database query: [what to check in DB]
- [Other verification steps]

---

#### TC-X.Y: [Next Test Case]
...

---

## Test Results

| Test Case | Status | Notes |
|-----------|--------|-------|
| TC-X.X | ⏳ PENDING | |
| TC-X.Y | ⏳ PENDING | |

---

**Test Execution Date:** TBD  
**Tester:** TBD  
**Environment:** TBD  
**Last Updated:** [Current Date]
```

### Test Case Status Indicators

- ⏳ PENDING - Not yet executed
- ✅ PASS - Test passed
- ❌ FAIL - Test failed
- ⏸️ SKIP - Test skipped (with reason)

### Best Practices

- **Be comprehensive**: Cover happy path, edge cases, and error scenarios
- **Be specific**: Include exact endpoints, expected status codes, and verification steps
- **Include prerequisites**: List all setup requirements clearly
- **Test data setup**: Specify test data requirements and use consistent test user IDs
- **Code references**: Include file paths and line numbers for implementation references (optional)
- **Verification steps**: Specify what to check in API, database, and logs
- **Organize by phases**: Group related test cases into logical phases
- **Keep it actionable**: Each test case should be clear enough to execute independently
- **Database context & Pre-run verification**: When creating test plans:
  - **Jalankan query** ke DB staging (MCP postgres-proconnect-stg / user-postgres) untuk: table structures, columns, FK, unique constraints, indexes, dan sample data.
  - Isi section **Data Context (from DB)** dengan ringkasan (enum values, master IDs, relasi).
  - Tambahkan section **Pre-run verification** berisi 3–6 SQL query yang bisa di-run ulang (dengan "Expect: ..." per query). Ini memastikan saat `/qa-test` dijalankan, pre-run verification memberi konteks dan validasi env sebelum execute TC.
  - Gunakan konteks ini untuk menulis verification steps di tiap TC (query apa yang dipakai untuk cek state di DB).

### Example

When user says `/create-test-plan user authentication login flow`, create a file like `user-authentication-test-plan.md` in `docs/testing/` with comprehensive test cases covering login scenarios, error handling, token validation, etc.

## Cursor Command: `/qa-test`

**Purpose:** Instruksi untuk membuat AI bertindak sebagai QA Tester yang melakukan comprehensive testing.

### Usage
```
/qa-test [test-plan-file] [instructions]
```

### Role: AI as QA Tester

AI akan:
- Execute test cases dari test plan
- Verify results dari multiple sources (API, database, logs)
- Document findings dan update test results

### Testing Capabilities

1. **API Testing**: Execute HTTP requests dengan `curl`, validate responses
2. **Database Verification**: Query via MCP `postgres-proconnect-stg` untuk verify data state, check table structures, relationships, dan constraints
3. **Log Analysis**: Read `logs/app.1.log` dan `logs/error.1.log` untuk verify operations
4. **Code Review**: Review implementation untuk understand expected behavior

### Workflow

1. **Pre-run verification (wajib)**: Sebelum execute test case mana pun:
   - Baca test plan dan cari section **"Pre-run verification"** atau **"Data Context (from DB)"**.
   - Jalankan **semua query SQL** di section tersebut via MCP **postgres-proconnect-stg** (atau `user-postgres` jika itu nama server yang tersedia) — read-only.
   - Untuk tiap query, cocokkan hasil dengan **ekspektasi** yang tercantum (e.g. "Expect: 1 row", "Expect: is_nullable = YES"). Jika ada query yang tidak memenuhi ekspektasi, **laporkan ke user** dan jangan lanjut execute TC sampai data/schema siap (atau user menyuruh skip).
   - Tujuan: memastikan konteks DB staging (tabel, relasi, data master, constraint) sudah oke sehingga test yang dijalankan punya landasan yang benar.
2. **Setup**: Read test plan, check prerequisites, prepare test data (termasuk token jika user berikan).
3. **Execute**: Run test cases, verify dari API → Database → Logs.
4. **Document**: Update test plan dengan status (✅ PASS / ❌ FAIL / ⏸️ SKIP) dan evidence.

### Test Plan Format

```markdown
### TC-X.X: Test Case Name
**Hit:** `METHOD /endpoint`
**Expected:** Status 200, data correct, DB updated, logs show events
**Verify:** API response, database query, log entries

## Test Results
| Test Case | Status | Notes |
|-----------|--------|-------|
| TC-X.X | ⬜ | |
```

### Pre-run verification (DB staging)

- **Selalu jalankan dulu** sebelum execute TC: ambil query dari section "Pre-run verification" / "Data Context (from DB)" di test plan.
- Gunakan MCP **postgres-proconnect-stg** (atau server Postgres staging yang tersedia) — **read-only**.
- Setiap query harus punya ekspektasi jelas di test plan (e.g. "Expect: 1 row", "Expect: 2 rows"). Jika hasil tidak sesuai, gagalkan run dan laporkan.
- Jika test plan tidak punya section Pre-run verification, **infer** query yang relevan dari Test Data Setup / Prerequisites (e.g. cek master data by ID, cek kolom nullable, cek index) dan jalankan untuk konteks; tetap laporkan hasil ke user.

### Best Practices

- Verify dari multiple sources (API, DB, logs) untuk accuracy
- Document evidence (queries, log snippets, responses)
- Ask user untuk data setup jika diperlukan
- Update test plan file dengan results
- **Data Modification**: Boleh ubah-ubah data yang baru di-create via API (POST/PATCH), jangan ubah-ubah data existing
- **User ID Consistency**: Gunakan 1 user_id yang konsisten untuk semua test data modifications, jangan multiple user_id untuk menghindari clustering effect jika ada masalah
- **Database Context**: Gunakan MCP `postgres-proconnect-stg` untuk check database schema, relationships, constraints, dan existing data patterns sebelum execute test cases untuk better understanding dan verification

### Tools

- `curl` untuk API testing
- MCP **postgres-proconnect-stg** (atau `user-postgres`) untuk database queries (read-only): **wajib** untuk pre-run verification (jalankan query dari test plan) dan verify data state setelah execute TC; juga untuk check table structures, relationships, constraints, dan existing data patterns
- `grep`/`tail` untuk log analysis
- `read_file` untuk code review

### Example Curl Commands

#### App Controller Endpoints

**GET /Tests/HelloWorld** (Public endpoint, no auth required)
```bash
# Without token
curl -X GET "http://localhost:3010/Tests/HelloWorld" \
  -H "Content-Type: application/json"

# With token (optional, not required for public endpoint)
curl -X GET "http://localhost:3010/Tests/HelloWorld" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**Expected Response:**
```json
{"message":"Hello User."}
```
Status: `200 OK`

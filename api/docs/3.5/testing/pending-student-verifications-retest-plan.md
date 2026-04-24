# Pending Student Verifications - Excel Import Test Cases (PENDING)

## Overview
Remaining test cases for Excel import functionality in pending student verifications feature.

**Status:** 3 test cases PENDING (Excel import - skipped due to complexity)

---

## Prerequisites
- ✅ API server running on `localhost:3010`
- ✅ Valid admin/sysadmin token (Bearer token)
- ✅ At least one school exists in `mst_schools` table
- ✅ Test user ID for data modifications (use consistent user_id for all test data)
- ✅ Redis server running (for queue processing)
- ✅ All migrations run successfully

## Test Data Setup
- **Test School ID**: Query from `mst_schools` table (use first available school)
- **Test User ID**: Use consistent user_id for all test data modifications
- **Test Student IDs**: Use unique student IDs (e.g., "RETEST001", "RETEST002", etc.)

---

## Test Cases

### Phase 2: Excel Import/Export

#### TC-2.2: Import Excel (Success - Multiple Rows)
**Hit:** `POST /pending-student-verifications/import`  
**Code Ref:** `src/user_educations/pending_student_verifications.service.ts` (line ~131-202)

**Setup:**
- Create Excel file with test data:
  - Row 2: RETEST009, <school_name>, Retest Student Nine, http://cdn.example.com/retest9.png, retest9@example.com, +62123456789, Computer Science
  - Row 3: RETEST010, <school_name>, Retest Student Ten, , , , Engineering

**Request:**
```bash
POST /pending-student-verifications/import
Content-Type: multipart/form-data
Body: file=<excel_file>
```

**Expected:**
- ✅ Status: `200 OK`
- ✅ Response contains success_count=2, error_count=0, errors=[]

**Verify:**
- API response shows correct counts
- Database query: Both entries created
- RETEST009 has all fields populated
- RETEST010 has only student_id and school_id (optional fields null)

---

#### TC-2.3: Import Excel (School Not Found - Fails Fast)
**Hit:** `POST /pending-student-verifications/import`  
**Code Ref:** `src/user_educations/pending_student_verifications.service.ts` (line ~174-179)

**Setup:**
- Create Excel file with invalid school name (non-existent school)

**Request:**
```bash
POST /pending-student-verifications/import
Content-Type: multipart/form-data
Body: file=<excel_file>
```

**Expected:**
- ✅ Status: `400 Bad Request`
- ✅ Error message mentions school not found

**Verify:**
- API returns BadRequestException
- No entries created in database

---

#### TC-2.4: Import Excel (Partial Success - Some Rows Fail)
**Hit:** `POST /pending-student-verifications/import`  
**Code Ref:** `src/user_educations/pending_student_verifications.service.ts` (line ~181-198)

**Setup:**
- Create Excel file:
  - Row 2: RETEST011, <school_name> (valid)
  - Row 3: RETEST001, <school_name> (duplicate - already exists from TC-1.1)

**Request:**
```bash
POST /pending-student-verifications/import
Content-Type: multipart/form-data
Body: file=<excel_file>
```

**Expected:**
- ✅ Status: `200 OK`
- ✅ Response contains success_count=1, error_count=1, errors=[{row: 3, message: "..."}]

**Verify:**
- API response shows partial success
- RETEST011 created, RETEST001 not created (duplicate)
- Error message describes the issue

---

## Test Results

| Test Case | Status | Notes |
|-----------|--------|-------|
| TC-2.2 | ⏳ PENDING | Excel Import (Success) - Skip Excel testing (complex setup) |
| TC-2.3 | ⏳ PENDING | Excel Import (School Not Found) - Skip Excel testing (complex setup) |
| TC-2.4 | ⏳ PENDING | Excel Import (Partial Success) - Skip Excel testing (complex setup) |

---

**Test Execution Date:** TBD  
**Tester:** TBD  
**Environment:** TBD  
**Last Updated:** 2025-01-XX

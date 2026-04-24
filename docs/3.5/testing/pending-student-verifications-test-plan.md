# Test Plan: Pending Student Verifications - Excel Import (PENDING)

## Overview
Remaining test cases for Excel import functionality in pending student verifications feature.

## Prerequisites
- API server running on `localhost:3010`
- Valid admin/sysadmin token (Bearer token)
- At least one school exists in `mst_schools` table
- Test user ID for data modifications (use consistent user_id for all test data)

## Test Data Setup
- **Test School ID**: Query from `mst_schools` table (use first available school)
- **Test User ID**: Use consistent user_id for all test data modifications
- **Test Student IDs**: Use unique student IDs (e.g., "TEST001", "TEST002", etc.)

---

## Test Cases

### Phase 2: Excel Import/Export

#### TC-2.2: Import Excel (Success)
**Prerequisites:** Create Excel file with test data:
- Row 2: TEST008, <school_name>, Test Student Eight, http://cdn.example.com/test8.png, test8@example.com, +62123456789, Computer Science
- Row 3: TEST009, <school_name>, Test Student Nine, , , , Engineering
**Hit:** `POST /pending-student-verifications/upload`
**Body:** multipart/form-data with Excel file
**Expected:**
- Status 200
- Response contains success_count=2, error_count=0, errors=[]

**Verify:**
- API response shows correct counts
- Database query: Both entries created
- TEST008 has all fields populated
- TEST009 has only student_id and school_id (optional fields null)

**Test Results:**
| Test Case | Status | Notes |
|-----------|--------|-------|
| TC-2.2 | ⬜ | |

---

#### TC-2.3: Import Excel (School Not Found)
**Prerequisites:** Create Excel file with invalid school name
**Hit:** `POST /pending-student-verifications/upload`
**Body:** multipart/form-data with Excel file containing non-existent school_name
**Expected:**
- Status 400
- Error message mentions school not found

**Verify:**
- API returns BadRequestException
- No entries created in database

**Test Results:**
| Test Case | Status | Notes |
|-----------|--------|-------|
| TC-2.3 | ⬜ | |

---

#### TC-2.4: Import Excel (Partial Success - Some Rows Fail)
**Prerequisites:** Create Excel file:
- Row 2: TEST010, <school_name> (valid)
- Row 3: TEST001, <school_name> (duplicate - already exists from TC-1.1)
**Hit:** `POST /pending-student-verifications/upload`
**Body:** multipart/form-data with Excel file
**Expected:**
- Status 200
- Response contains success_count=1, error_count=1, errors=[{row: 3, message: "..."}]

**Verify:**
- API response shows partial success
- TEST010 created, TEST001 not created (duplicate)
- Error message describes the issue

**Test Results:**
| Test Case | Status | Notes |
|-----------|--------|-------|
| TC-2.4 | ⬜ | |

---

## Summary

### Test Coverage
- ⏳ Excel import functionality (3 test cases pending)

### Test Execution Notes
- Use consistent test_user_id for all data modifications
- Clean up test data after execution (soft-delete or use test-specific identifiers)
- Verify from multiple sources: API → Database → Logs
- Document evidence (queries, responses, log snippets) in Notes column

---

## Test Results Summary

| Phase | Test Cases | Passed | Failed | Skipped | Pending |
|-------|------------|--------|--------|---------|---------|
| Phase 2: Excel | 3 | 0 | 0 | 0 | 3 |
| **Total** | **3** | **0** | **0** | **0** | **3** |

**Note:** 
- Phase 2: ⏳ PENDING (3 test cases) - Excel import testing skipped due to complexity

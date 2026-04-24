# Phase 3: Automation Flows - Retry Mechanism Test (PENDING)

## Overview
Remaining test case for retry mechanism in Bull queue processing.

**Duration:** ~1 day

## Prerequisites
- ✅ Phase 1-2 completed
- ✅ Redis running (for queues)
- ✅ Mappings exist (education-license, license-skill)
- ✅ Test user with education/certificate
- ✅ Bull Board accessible at `/admin/queues`

---

## Test Cases

### TC-3.13: Retry Mechanism for Failed Jobs
**Hit:** Bull dashboard or API  
**Code Ref:** Bull queue processors in `src/queues/processors/`  
**Bull Board URL:** `http://localhost:3010/admin/queues` (or `{BASE_URL}/admin/queues`)

**Prerequisites:**
- Queue job that will fail (e.g., invalid data, missing FK reference)
- Bull dashboard accessible at `/admin/queues`
- **Authentication Required:** Bearer token with SYS_ADMIN role
  - Only users with `SYS_ADMIN` role assignment can access Bull Board
  - Request must include `Authorization: Bearer {firebase_token}` header
  - Non-admin users will receive `403 Forbidden` response

**Steps:**
1. **Trigger Failed Job:**
   - Create scenario that causes queue job to fail
   - Example: Verify education with invalid `mst_license_id` in mapping
   - Or: Verify certificate with deleted `mst_license_id`

2. **Verify Job Failure:**
   - Check Bull dashboard: Job status = `failed`
   - Check logs: Error logged with stack trace
   - Check database: No partial data created

3. **Retry Failed Job:**
   - Via Bull dashboard: Click "Retry" on failed job
   - Or: Fix the underlying issue (e.g., restore deleted license)
   - Retry the job

4. **Verify Retry Success:**
   - Check Bull dashboard: Job status = `completed` (after retry)
   - Check database: Data created correctly after retry
   - Check logs: Retry executed successfully

**Expected:**
- ✅ Failed jobs marked as `failed` in Bull dashboard
- ✅ Error details visible in Bull dashboard (stack trace, error message)
- ✅ Failed jobs can be retried via Bull dashboard
- ✅ Retried jobs execute successfully (if underlying issue fixed)
- ✅ Retry doesn't create duplicate data (upsert logic works)
- ✅ Retry count tracked in Bull dashboard
- ✅ Maximum retry attempts configurable (if set)

**Verify:**
- Check Bull dashboard: Failed job visible with error details
- Check Bull dashboard: Retry button/action available
- Check Bull dashboard: Job status changes to `completed` after successful retry
- Check database: Data created correctly after retry
- Check logs: Retry attempt logged
- Check: No duplicate data created on retry

**Edge Cases to Test:**
- Retry with same error → job fails again
- Retry after fixing issue → job succeeds
- Multiple retries → retry count increments
- Retry expired job → handled according to Bull configuration
- Retry job that was manually removed → appropriate error handling

---

## Test Results

| Test Case | Status | Notes |
|-----------|--------|-------|
| TC-3.13 | ⏸️ PENDING | Bull Board now available at `/admin/queues`. Ready for manual testing. Requires Bull dashboard access and manual retry testing. |

---

**Test Execution Date:** TBD  
**Tester:** TBD  
**Environment:** http://localhost:3010  
**Last Updated:** 2025-11-25

**Summary:**
- ⏸️ **1 test case PENDING** (TC-3.13)
  - TC-3.13: Bull Board now available at `/admin/queues` - ready for manual testing

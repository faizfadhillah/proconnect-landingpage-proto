# Skill Match System (Phase 3.5) - Comprehensive Context

## What Is This System?

The Skill Match System automatically grants licenses and skills to users based on their approved education and certificates. It uses a three-tier mapping system with approval state machine:

1. **Education → License**: Approved education automatically grants licenses
2. **License → Skill**: Approved certificates automatically grant skills  
3. **Informal Certificates**: External certificates matched by email/phone grant licenses

The system operates asynchronously using Bull queues, ensuring non-blocking operations and reliable processing.

### Approval State Machine

All user data (educations, certificates, skills) follows a **state machine flow**:

```
WAITING_APPROVAL → APPROVED (triggers automation)
                 ↓
                REJECT

Final States: APPROVED and REJECT (cannot be changed)
```

- **Manual Create**: `approval_state = WAITING_APPROVAL`
- **Auto-Granted**: `approval_state = APPROVED` + `approval_by = 'system'`
- **Admin Approve**: `approval_state = APPROVED` + `approval_by = admin_id`
- **is_verified**: Set for backward compatibility with FE; **not the trigger** for automation

---

## Core Data Model

### Master Data Tables
- **`mst_licenses`** - Centralized license/certificate definitions
  - Location: `src/mst_licenses/`
  - Contains: license_number, license_name, issuing_organization, issue_date, certification_status

- **`mst_majors`** - Academic majors (Computer Science, Engineering, etc.)
  - Location: `src/mst_majors/`
  - Simple table with major_name

- **`mst_school_majors`** - School-Major relationships
  - Location: `src/mst_school_majors/`
  - Links schools to available majors

### Mapping Tables
- **`mst_education_license_mappings`** - Maps education criteria to licenses
  - Location: `src/mst_education_license_mappings/`
  - Criteria: school_id + major_id + degree + diploma_level → license_id
  - Unique constraint prevents duplicates

- **`mst_license_skill_mappings`** - Maps licenses to skills
  - Location: `src/mst_license_skill_mappings/`
  - Simple: license_id → skill_id
  - One license can map to multiple skills

- **`mst_informal_certificate_mappings`** - Maps email/phone to licenses
  - Location: `src/mst_informal_certificate_mappings/`
  - Status: PROCESSED/UNPROCESSED
  - At least one of email or phone required

### Updated User Tables
- **`user_certificates`** - Added `mst_license_id` FK
  - Links user certificates to master license definitions
  - Location: `src/user_certificates/`

- **`user_educations`** - Added `diploma_level` field
  - Stores diploma level (L1, L2, L3, etc.) for mapping
  - Location: `src/user_educations/`

- **`user_role_assignments`** - Added `school_id` for PIC_SCHOOL role
  - Enables school-scoped access control
  - Location: `src/user_role_assignments/`

---

## Core Automation Flows

### Flow 1: Education Verification → License Granting

**Trigger:** Admin approves education via `PATCH /user-educations/:id/approval` with `approval_state = APPROVED`

**Process Flow:**
```
1. EducationVerificationService.approve() sets approval_state to APPROVED
   └─> Location: src/user_educations/service/education-verification.service.ts
   └─> Also sets: is_verified = true (for FE backward compatibility)
   └─> Validation: Cannot change if already in final state (APPROVED/REJECT)
   
2. Adds job to EDUCATION_VERIFICATION_QUEUE
   └─> Queue: education-verification
   └─> Job data: { educationId: string }
   
3. EducationVerificationProcessor handles job
   └─> Location: src/queues/processors/education-verification.processor.ts
   └─> Calls: EducationVerificationService.processEducationVerificationById()
   
4. processEducationVerification() validates approval_state = APPROVED
   └─> Skips processing if not APPROVED (logged as warning)
   └─> Validates required fields: school_id, major_id, education_degree, diploma_level
   
5. Finds matching education-license mappings
   └─> Query: mst_education_license_mappings WHERE
        school_id = education.school_id
        AND major_id = education.major_id
        AND degree = education.education_degree
        AND diploma_level = education.diploma_level
   
6. For each mapping, grants license via UserCertificatesService.grantVerifiedLicense()
   └─> Location: src/user_certificates/user_certificates.service.ts
   └─> Method: grantVerifiedLicense(userId, licenseId, license, description, userEducationId)
   └─> Creates/updates user_certificate with:
        - approval_state = APPROVED
        - approval_by = 'system'
        - is_verified = true
        - user_education_id = education.id (links back to education)
   └─> If new cert created, triggers CERTIFICATE_VERIFICATION_QUEUE
```

**Edge Cases:**
- Education not APPROVED → Skipped (logged warning)
- Missing required fields → Skipped (logged warning)
- No mappings found → Logged, no error (graceful)
- Multiple mappings → All licenses granted
- Existing certificate → Updated to APPROVED (approval flow)
- Multiple certificates per user+license allowed → Filters by user_education_id
- Error in one license → Others continue processing

**Edit Restrictions:**
- Cannot edit education if approval_state is APPROVED or REJECT
- Only WAITING_APPROVAL educations can be edited

**Key Files:**
- `src/user_educations/service/education-verification.service.ts` - Approval & trigger logic
- `src/mst_education_license_mappings/mst_education_license_mappings.service.ts` - findByEducation()
- `src/user_certificates/user_certificates.service.ts` - grantVerifiedLicense()
- `src/queues/processors/education-verification.processor.ts` - Queue processor

---

### Flow 2: Certificate Verification → Skill Granting

**Trigger:** Certificate `approval_state` changes to APPROVED AND `mst_license_id` exists

**Process Flow:**
```
1. UserCertificatesService.saveAndApproveUserCertificate() sets approval_state
   └─> Location: src/user_certificates/user_certificates.service.ts
   └─> Sets: approval_state = APPROVED, approval_by = 'system', is_verified = true
   
2. Adds job to CERTIFICATE_VERIFICATION_QUEUE
   └─> Queue: certificate-verification
   └─> Job data: { certificateId: string }
   └─> Skips if mst_license_id is null (logged warning)
   
3. CertificateVerificationProcessor handles job
   └─> Location: src/queues/processors/certificate-verification.processor.ts
   └─> Calls: UserCertificatesService.processCertificateVerificationById()
   
4. processCertificateVerification() validates approval_state = APPROVED
   └─> Skips if not APPROVED (logged warning)
   └─> Skips if mst_license_id is null (logged info)
   
5. Finds license-skill mappings
   └─> Query: mst_license_skill_mappings WHERE license_id = certificate.mst_license_id
   
6. For each mapping, grants skill via UserSkillsService.grantVerifiedSkill()
   └─> Location: src/user_skills/user_skills.service.ts
   └─> Method: grantVerifiedSkill(userId, skillId)
   └─> Upserts user_skill with:
        - approval_state = APPROVED
        - approval_by = 'system'
        - is_verified = true
```

**Edge Cases:**
- Certificate not APPROVED → Skipped (logged warning)
- No mst_license_id → Skipped (logged info)
- No mappings found → Logged, no error
- Multiple mappings → All skills granted
- Existing skill → Updated to APPROVED (upsert)
- Error in one skill → Others continue processing

**Edit Restrictions:**
- Can only edit if approval_state = WAITING_APPROVAL
- Cannot edit license-related fields (mst_license_id, license_number, etc.)
- Defensive: Ignores approval fields if somehow provided in update

**Key Files:**
- `src/user_certificates/user_certificates.service.ts` - Approval & processing logic
- `src/mst_license_skill_mappings/mst_license_skill_mappings.service.ts` - findByLicenseId()
- `src/user_skills/user_skills.service.ts` - grantVerifiedSkill()
- `src/queues/processors/certificate-verification.processor.ts` - Queue processor

---

### Flow 2.5: Pending Certificate Creation (On Education Create)

**Trigger:** User creates education via `POST /user-educations`

**Process Flow:**
```
1. User creates education with required fields (school_id, major_id, degree, diploma_level)
   └─> Location: src/user_educations/service/user_educations.service.ts
   └─> Creates education with approval_state = WAITING_APPROVAL
   
2. Auto-Approval Check (if student_id + school_id match pending_student_verification)
   └─> Location: src/user_educations/service/education-verification.service.ts
   └─> Method: autoApproveAndTriggerVerification()
   └─> If match found:
        - Sets approval_state = APPROVED
        - Sets approval_by = 'system'
        - Deletes pending entry
        - Triggers EDUCATION_VERIFICATION_QUEUE
   
3. Create Pending Certificates (for all educations)
   └─> Location: src/user_educations/service/education-verification.service.ts
   └─> Method: createPendingCertificates()
   └─> Finds all matching education-license mappings
   └─> For each mapping:
        - Checks if certificate already exists (by user_id, mst_license_id, user_education_id)
        - If not exists, creates certificate with:
          * approval_state = WAITING_APPROVAL
          * user_education_id = education.id (links to education)
          * mst_license_id = mapping.license_id
          * certificate_level = license.certificate_level
          * no_expiry = true
```

**Purpose:**
- Pre-create certificates linked to education
- When education is approved, these certificates are automatically approved too
- Maintains referential integrity between education and granted licenses

**Edge Cases:**
- Missing required fields → Skipped (logged warning)
- No mappings found → No certificates created (logged info)
- Certificate already exists → Skipped (not duplicated)
- Error creating certificate → Logged, others continue

**Key Files:**
- `src/user_educations/service/education-verification.service.ts` - createPendingCertificates(), autoApproveAndTriggerVerification()
- `src/user_certificates/user_certificate.dao.ts` - findByUserLicenseAndEducation()

---

### Flow 3: Informal Certificate Processing

**Two Triggers:**

#### Trigger A: Admin Creates Mapping
**When:** Admin creates mapping via `POST /mst-informal-certificate-mappings`

**Process Flow:**
```
1. MstInformalCertificateMappingsService.create() saves mapping
   └─> Location: src/mst_informal_certificate_mappings/mst_informal_certificate_mappings.service.ts
   └─> Status: UNPROCESSED
   
2. Adds job to INFORMAL_CERTIFICATE_PROCESSING_QUEUE
   └─> Queue: informal-certificate-processing
   └─> Job data: { mappingId: string }
   
3. InformalCertificateProcessingProcessor handles job
   └─> Location: src/queues/processors/informal-certificate-processing.processor.ts
   └─> Calls: MstInformalCertificateMappingsService.processMapping()
   
4. processMapping() searches for matching users
   └─> Gets all active users (phone is encrypted, requires full scan)
   └─> Bulk decrypts encrypted_user_data for phone matching
   └─> Matches by email OR phone
   
5. For each matching user, grants license
   └─> Uses: UserCertificatesService.grantVerifiedLicense()
   └─> Updates mapping status to PROCESSED
```

#### Trigger B: User Registration/Update
**When:** User registers or updates email/phone via `POST /users/register-candidate` or `PUT /users/:id`

**Process Flow:**
```
1. UsersService.registerCandidate() or update() creates/updates user
   └─> Location: src/users/users.service.ts
   
2. Adds job to INFORMAL_CERTIFICATE_USER_PROCESSING_QUEUE
   └─> Queue: informal-certificate-user-processing
   └─> Job data: { userId: string, phone?: string }
   
3. InformalCertificateUserProcessingProcessor handles job
   └─> Location: src/queues/processors/informal-certificate-user-processing.processor.ts
   └─> Calls: UsersService.processInformalCertificatesForUser()
   
4. processInformalCertificatesForUser() finds unprocessed mappings
   └─> Query: mst_informal_certificate_mappings WHERE
        status = UNPROCESSED
        AND (email = user.email OR phone = decrypted_phone)
   
5. For each matching mapping, grants license
   └─> Uses: UserCertificatesService.grantVerifiedLicense()
   └─> Updates mapping status to PROCESSED
```

**Edge Cases:**
- No matching users → Mapping stays UNPROCESSED
- Multiple users match → All get license
- Phone decryption fails → Skipped (logged)
- Mapping already PROCESSED → Skipped
- No email/phone in mapping → Validation error

**Key Files:**
- `src/mst_informal_certificate_mappings/mst_informal_certificate_mappings.service.ts` - Processing logic
- `src/users/users.service.ts` - User registration/update triggers
- `src/encrypted_user_data/encrypted_user_data.service.ts` - Phone decryption
- `src/queues/processors/informal-certificate-*.processor.ts` - Queue processors

---

### Flow 4: Retroactive Processing (Bi-Directional)

**When:** Admin creates/updates mapping AFTER users already have approved data, OR user creates certificate/skill

#### Direction A: Mapping Created → Find Existing Users

##### Education-License Mapping Retroactive
**Trigger:** `POST /mst-education-license-mappings` or `PUT /mst-education-license-mappings/:id`

**Process Flow:**
```
1. MstEducationLicenseMappingsService.create() or update() saves mapping
   └─> Location: src/mst_education_license_mappings/mst_education_license_mappings.service.ts
   
2. Adds job to RETROACTIVE_EDUCATION_LICENSE_QUEUE
   └─> Queue: retroactive-education-license
   └─> Job data: { mappingId: string }
   
3. RetroactiveEducationLicenseProcessor handles job
   └─> Location: src/queues/processors/retroactive-education-license.processor.ts
   └─> Calls: MstEducationLicenseMappingsService.processRetroactiveMappings()
   
4. processRetroactiveMappings() finds matching approved educations
   └─> Query: user_educations WHERE
        school_id = mapping.school_id
        AND major_id = mapping.major_id
        AND education_degree = mapping.degree
        AND diploma_level = mapping.diploma_level
        AND approval_state = APPROVED
        AND deleted_at IS NULL
        
5. For each matching education, grants license
   └─> Uses: UserCertificatesService.grantVerifiedLicense()
```

##### License-Skill Mapping Retroactive
**Trigger:** `POST /mst-license-skill-mappings` or `PUT /mst-license-skill-mappings/:id`

**Process Flow:**
```
1. MstLicenseSkillMappingsService.create() or update() saves mapping
   └─> Location: src/mst_license_skill_mappings/mst_license_skill_mappings.service.ts
   
2. Adds job to RETROACTIVE_LICENSE_SKILL_QUEUE
   └─> Queue: retroactive-license-skill
   └─> Job data: { mappingId: string }
   
3. RetroactiveLicenseSkillProcessor handles job
   └─> Location: src/queues/processors/retroactive-license-skill.processor.ts
   └─> Calls: MstLicenseSkillMappingsService.processRetroactiveMappings()
   
4. processRetroactiveMappings() finds approved certificates with license
   └─> Query: user_certificates WHERE
        mst_license_id = mapping.license_id
        AND approval_state = APPROVED
        AND deleted_at IS NULL
        
5. For each matching certificate, grants skill
   └─> Uses: UserSkillsService.grantVerifiedSkill()
```

#### Direction B: User Data Created → Check Existing Mappings

##### Certificate Created → Check If Education Should Have Granted It
**Trigger:** `POST /user-certificates` (user manually creates certificate)

**Process Flow:**
```
1. UserCertificatesService.create() saves certificate
   └─> Location: src/user_certificates/user_certificates.service.ts
   └─> Certificate created with approval_state = WAITING_APPROVAL
   
2. If mst_license_id provided, adds job to RETROACTIVE_EDUCATION_LICENSE_QUEUE
   └─> Queue: retroactive-education-license
   └─> Job data: { userId: string, licenseId: string }
   └─> Via: RetroactiveEducationLicenseQueuePublisher.publishCertificateJob()
   
3. RetroactiveEducationLicenseProcessor handles job (dual job type)
   └─> Location: src/queues/processors/retroactive-education-license.processor.ts
   └─> Calls: MstEducationLicenseMappingsService.processRetroactiveEducationForLicense()
   
4. processRetroactiveEducationForLicense() finds user's approved educations
   └─> Query: user_educations WHERE
        user_id = userId
        AND approval_state = APPROVED
        AND deleted_at IS NULL
   
5. For each education, check if mapping exists for this specific license
   └─> Query: mst_education_license_mappings WHERE
        school_id = education.school_id
        AND major_id = education.major_id
        AND degree = education.education_degree
        AND diploma_level = education.diploma_level
        AND license_id = licenseId
   
6. If mapping found, auto-approve certificate
   └─> Uses: UserCertificatesService.grantVerifiedLicense()
   └─> Sets approval_state = APPROVED, approval_by = 'system'
```

##### Skill Created → Check If Certificate Should Have Granted It
**Trigger:** `POST /user-skills` (user manually creates skill)

**Process Flow:**
```
1. UserSkillsService.create() saves skill
   └─> Location: src/user_skills/user_skills.service.ts
   └─> Skill created with approval_state = WAITING_APPROVAL
   
2. Adds job to RETROACTIVE_LICENSE_SKILL_QUEUE
   └─> Queue: retroactive-license-skill
   └─> Job data: { userId: string, skillId: string }
   └─> Via: RetroactiveLicenseSkillQueuePublisher.publishSkillJob()
   
3. RetroactiveLicenseSkillProcessor handles job (dual job type)
   └─> Location: src/queues/processors/retroactive-license-skill.processor.ts
   └─> Calls: MstLicenseSkillMappingsService.processRetroactiveCertificateForSkill()
   
4. processRetroactiveCertificateForSkill() finds user's approved certificates
   └─> Query: user_certificates WHERE
        user_id = userId
        AND approval_state = APPROVED
        AND mst_license_id IS NOT NULL
        AND deleted_at IS NULL
   
5. For each certificate, check if mapping exists for this specific skill
   └─> Query: mst_license_skill_mappings WHERE
        license_id = certificate.mst_license_id
        AND skill_id = skillId
   
6. If mapping found, auto-approve skill
   └─> Uses: UserSkillsService.grantVerifiedSkill()
   └─> Sets approval_state = APPROVED, approval_by = 'system'
```

**Edge Cases:**
- No matching data → No action (logged)
- Large dataset → Processed in background queue
- Errors in processing → Logged, others continue
- Multiple matches → Only first match processed (breaks after first grant)

**Key Files:**
- `src/mst_education_license_mappings/mst_education_license_mappings.service.ts` - Both directions
- `src/mst_license_skill_mappings/mst_license_skill_mappings.service.ts` - Both directions
- `src/queues/processors/retroactive-*.processor.ts` - Dual job type handlers
- `src/queues/publishers/retroactive-*.publisher.ts` - Queue publishers

---

## Role-Based Access Control

### PIC_SCHOOL Role
**Purpose:** School administrators can manage education-license mappings for their assigned schools only.

**Implementation:**
- Role: `PIC_SCHOOL` in `UserRoleAssignmentRole` enum
- Location: `src/user_role_assignments/enums/user_role_assignment.enums.ts`
- Assignment: `user_role_assignments` table with `school_id` field
- Scope Filtering: `src/rbac/scope-filter.service.ts` - `applySchoolScope()`

**Access Rules:**
- **SYS_ADMIN**: Full access to all mappings
- **PIC_SCHOOL**: Can only CRUD mappings for assigned `school_id`
- **Others**: No access to mapping endpoints

**Permission Check:**
- Location: `src/mst_education_license_mappings/mst_education_license_mappings.service.ts`
- Method: `checkCreatePermission(userId, schoolId)`
- Validates: User is SYS_ADMIN OR (PIC_SCHOOL AND school_id matches)

**Search Filtering:**
- PIC_SCHOOL users automatically filtered to assigned schools
- Location: `src/mst_education_license_mappings/mst_education_license_mappings.service.ts`
- Method: `search()` applies school scope filter

---

## Queue System Architecture

### Queue Constants
**Location:** `src/common/queues/queue.constants.ts`

**Queues:**
1. `EDUCATION_VERIFICATION_QUEUE` - Education → License flow
2. `CERTIFICATE_VERIFICATION_QUEUE` - Certificate → Skill flow
3. `INFORMAL_CERTIFICATE_PROCESSING_QUEUE` - Admin-created informal mappings
4. `INFORMAL_CERTIFICATE_USER_PROCESSING_QUEUE` - User registration/update trigger
5. `RETROACTIVE_EDUCATION_LICENSE_QUEUE` - Retroactive education-license
6. `RETROACTIVE_LICENSE_SKILL_QUEUE` - Retroactive license-skill
7. `SEND_EMAIL_QUEUE` - Email notifications (existing)

### Queue Registration
**Location:** `src/app/app.module.ts`
- All queues registered in AppModule
- QueuesModule imports processors
- Location: `src/queues/queues.module.ts`

### Queue Processors
**Location:** `src/queues/processors/`
- Each queue has dedicated processor
- Processors call service methods (no direct DAO access)
- Error handling: Re-throw to mark job as failed in Bull

### Graceful Shutdown
**Location:** `src/app/shutdown.service.ts`
- Closes all 7 queues on SIGTERM/SIGINT
- Timeout: 5 seconds total for all queues (via Promise.race)
- Prevents connection leaks during deployment
- Handles: uncaughtException, unhandledRejection signals

---

## Centralized Methods (DRY Principle)

### UserCertificatesService.grantVerifiedLicense()
**Location:** `src/user_certificates/user_certificates.service.ts`

**Purpose:** Single source of truth for license granting
- Used by: Education verification, Informal certificates, Retroactive processing
- Logic: Upsert user_certificate, auto-triggers skill granting if new cert

**Signature:**
```typescript
grantVerifiedLicense(
  userId: string,
  licenseId: string,
  license: MstLicense,
  description?: string
): Promise<UserCertificate>
```

### UserSkillsService.grantVerifiedSkill()
**Location:** `src/user_skills/user_skills.service.ts`

**Purpose:** Single source of truth for skill granting
- Used by: Certificate verification, Retroactive processing
- Logic: Upsert user_skill as verified

**Signature:**
```typescript
grantVerifiedSkill(
  userId: string,
  skillId: string
): Promise<UserSkill>
```

---

## Edge Cases & Error Handling

### Duplicate Prevention (Layered Strategy)

Following user preference [[memory:10540461]], duplicate prevention is implemented at DTO level first, with DB constraints as backup:

- **Education-License Mappings**: 
  - DTO Level: `findDuplicate()` check before create/update → BadRequestException
  - DB Level: Unique index on (school_id, major_id, degree, diploma_level, license_id) WHERE deleted_at IS NULL
  
- **License-Skill Mappings**: 
  - DTO Level: `findDuplicate()` check before create/update → BadRequestException
  - DB Level: Unique index on (license_id, skill_id) WHERE deleted_at IS NULL
  
- **Informal Certificates**: 
  - DTO Level: `findDuplicate()` check before create/update → BadRequestException
  - DB Level: Indexes on email, phone, status, license_id (NO unique constraint, intentional)
  - Note: Multiple mappings with same email/phone/license allowed (different name/photo combinations)
  
- **User Certificates**: 
  - Service Level: Multiple certificates per user+license allowed (by design)
  - Filters by user_education_id when granting to avoid duplicates for same education
  - ConflictException validation at DTO level for user_id + skill_id
  
- **User Skills**: 
  - DTO Level: `validateUniqueUserSkill()` check → ConflictException
  - Upsert logic in `grantVerifiedSkill()` prevents duplicates during auto-grant

### Edit Restrictions (Approval State Machine)

**User Educations:**
- Can only edit if `approval_state = WAITING_APPROVAL`
- Cannot edit if `approval_state = APPROVED` or `REJECT` → BadRequestException
- Validation: `isFinalApprovalState()` check

**User Certificates:**
- Can only edit if `approval_state = WAITING_APPROVAL`
- Cannot edit if `approval_state = APPROVED` or `REJECT` → BadRequestException
- Defensive: Ignores `is_verified`, `approval_state`, `approval_by` if provided in update
- License fields (license_number, license_name, etc.) are READ-ONLY, ignored in updates

**User Skills:**
- Can only edit if `approval_state = WAITING_APPROVAL`
- Cannot edit if `approval_state = APPROVED` or `REJECT` → BadRequestException
- Defensive: Ignores `is_verified`, `approval_state`, `approval_by` if provided in update

**Informal Certificate Mappings:**
- Can only edit/delete if `status = UNPROCESSED`
- Cannot edit/delete if `status = PROCESSED` → BadRequestException

### Missing Data Handling
- No mappings found → Logged, no error (graceful degradation)
- Missing FK references → Validation error at DTO level
- Encrypted phone decryption fails → Skipped, logged
- User not found → NotFoundException

### Async Error Handling
- Queue job failures → Marked as failed in Bull, logged
- One item fails → Others continue processing
- Main operation succeeds even if automation fails
- Errors logged with context (userId, educationId, etc.)

### Status Management
- **Approval States**: WAITING_APPROVAL → APPROVED/REJECT (final states, cannot be changed)
- **Approval Trigger**: `approval_state = APPROVED` triggers automation (NOT `is_verified`)
- **is_verified Field**: Set for backward compatibility with FE, always mirrors APPROVED state
- **approval_by Field**: Tracks who approved ('system' for auto-approval, user_id for manual)
- **Informal Certificates**: UNPROCESSED → PROCESSED (prevents reprocessing)
- **Soft Deletes**: `deleted_at IS NULL` in all queries

---

## File Structure Reference

### Master Data Modules
- `src/mst_licenses/` - License master data
- `src/mst_majors/` - Major master data
- `src/mst_school_majors/` - School-Major relationships

### Mapping Modules
- `src/mst_education_license_mappings/` - Education → License mappings
- `src/mst_license_skill_mappings/` - License → Skill mappings
- `src/mst_informal_certificate_mappings/` - Informal certificate mappings

### User Data Modules
- `src/user_educations/` - Education verification trigger
- `src/user_certificates/` - Certificate verification trigger + grantVerifiedLicense()
- `src/user_skills/` - Skill granting + grantVerifiedSkill()
- `src/users/` - Informal certificate processing on registration

### Queue System
- `src/common/queues/queue.constants.ts` - All queue name constants
- `src/queues/queues.module.ts` - Queue module registration
- `src/queues/processors/` - All queue processors

### RBAC & Permissions
- `src/user_role_assignments/` - PIC_SCHOOL role implementation
- `src/rbac/scope-filter.service.ts` - School scope filtering
- `src/rbac/rbac.seed.constants.ts` - PIC_SCHOOL role and permissions

### Shutdown
- `src/app/shutdown.service.ts` - Graceful shutdown orchestration
- `src/main.ts` - Shutdown service setup

---

## Database Migrations

**Location:** `migrations/`

1. `create-mst-licenses.ts` - Master license table
2. `create-mst-majors.ts` - Master major table
3. `create-mst-school-majors.ts` - School-Major relationships
4. `add-mst-license-id-to-user-certificates.ts` - FK to user_certificates
5. `add-diploma-level-to-user-educations.ts` - Diploma level field
6. `add-school-id-to-user-role-assignments.ts` - PIC_SCHOOL support
7. `create-mst-education-license-mappings.ts` - Education-License mapping table
8. `create-mst-license-skill-mappings.ts` - License-Skill mapping table
9. `create-mst-informal-certificate-mappings.ts` - Informal certificate mapping table

---

## Key Design Decisions

1. **Backward Compatibility**: All new fields nullable, existing data works unchanged
2. **DRY Principle**: Centralized methods (grantVerifiedLicense, grantVerifiedSkill) reused across flows
3. **Queue-Based**: All async operations use Bull queues for reliability and monitoring
4. **School Scoping**: PIC_SCHOOL role restricts access to assigned schools only
5. **Retroactive Processing**: New mappings automatically apply to existing verified data
6. **Upsert Logic**: Prevents duplicates, updates existing records instead of creating new ones
7. **Graceful Degradation**: Main operations succeed even if automation fails
8. **Service → DAO → Repository**: Clean separation of concerns

---

## API Endpoints

### Master Data Endpoints
- **`GET/POST/PUT/DELETE /mst-licenses/*`** - License CRUD operations
  - Location: `src/mst_licenses/mst_licenses.controller.ts`
- **`GET/POST/PUT/DELETE /mst-majors/*`** - Major CRUD operations
  - Location: `src/mst_majors/mst_majors.controller.ts`
- **`GET/POST/PUT/DELETE /mst-school-majors/*`** - School-Major relationship CRUD
  - Location: `src/mst_school_majors/mst_school_majors.controller.ts`

### Mapping Endpoints
- **`GET/POST/PUT/DELETE /mst-education-license-mappings/*`** - Education-License mapping CRUD
  - Location: `src/mst_education_license_mappings/mst_education_license_mappings.controller.ts`
  - `GET /search` - Search with filters, pagination, scope filtering
  - `GET /template/download` - Download Excel template
  - `POST /upload` - Upload Excel file for bulk mapping
  - Permission: SYS_ADMIN (all schools) or PIC_SCHOOL (assigned schools only)

- **`GET/POST/PUT/DELETE /mst-license-skill-mappings/*`** - License-Skill mapping CRUD
  - Location: `src/mst_license_skill_mappings/mst_license_skill_mappings.controller.ts`
  - `GET /search` - Search with filters
  - `GET /template/download` - Download Excel template
  - `POST /upload` - Upload Excel file

- **`GET/POST/PUT/DELETE /mst-informal-certificate-mappings/*`** - Informal certificate mapping CRUD
  - Location: `src/mst_informal_certificate_mappings/mst_informal_certificate_mappings.controller.ts`
  - `GET /search` - Search with filters
  - `GET /template/download` - Download Excel template
  - `POST /upload` - Upload Excel file

### Verification Triggers
- **`PUT /user-educations/:id`** - Update education (triggers Flow 1 if is_verified changes to true)
  - Location: `src/user_educations/user_educations.controller.ts`
- **`PUT /user-certificates/:id`** - Update certificate (triggers Flow 2 if is_verified changes to true)
  - Location: `src/user_certificates/user_certificates.controller.ts`

### User Registration
- **`POST /users/register-candidate`** - Register candidate (triggers Flow 3B)
  - Location: `src/users/users.controller.ts`
- **`PUT /users/:id`** - Update user email/phone (triggers Flow 3B if changed)
  - Location: `src/users/users.controller.ts`

---

## Technology Stack

- **Framework:** NestJS
- **ORM:** TypeORM
- **Database:** PostgreSQL
- **Queue System:** Bull (Redis-backed)
- **Validation:** class-validator
- **Documentation:** Swagger/OpenAPI
- **File Processing:** ExcelJS
- **No New Dependencies:** All features use existing project libraries

---

## Common Pitfalls & Solutions

### 1. Major Field Usage
**Current Design:** 
- `user_education.major` = String (user input, for display)
- `user_education.major_id` = UUID (FK to mst_majors, for matching)

**Matching Logic:** Uses `major_id` directly, NO string lookup needed
- Location: `src/mst_education_license_mappings/mst_education_license_mappings.dao.ts`
- Query: Matches `education.major_id` to `mapping.major_id` (UUID-to-UUID)

### 2. Approval State vs is_verified Confusion
**Problem:** FE might rely on `is_verified` field, but automation is triggered by `approval_state`

**Solution:** Backend always sets both fields together
- `approval_state = APPROVED` → triggers automation
- `is_verified = true` → set for FE backward compatibility
- FE should use `is_verified` for display, but understand it mirrors `approval_state`
- Location: All service approval methods

### 3. Async Processing Errors
**Problem:** Main operation fails if async processing fails

**Solution:** All async operations use Bull queues - processors handle errors internally, failed jobs can be retried via Bull dashboard
- Location: All queue processors in `src/queues/processors/`

### 4. Duplicate Prevention
**Problem:** Multiple triggers create duplicate certificates/skills

**Solution:** 
- DTO-level validation before DB (preferred, per user memory)
- Upsert logic in `grantVerifiedLicense()` and `grantVerifiedSkill()` for auto-grants
- Always check for existing records before creating
- Location: `src/user_certificates/user_certificates.service.ts` and `src/user_skills/user_skills.service.ts`

### 5. Permission Scope
**Problem:** PIC_SCHOOL sees all schools in search

**Solution:** School scope filtering applied in service layer `search()` method
- Location: `src/mst_education_license_mappings/mst_education_license_mappings.service.ts`
- Method: `search()` automatically filters by assigned schools for PIC_SCHOOL users

### 6. Edit After Approval
**Problem:** Users try to edit educations/certificates after approval

**Solution:** Validation check in update methods
- Can only edit if `approval_state = WAITING_APPROVAL`
- Throws BadRequestException for APPROVED or REJECT states
- Location: All user data service update methods

### 7. Migration Order
**Problem:** Foreign key constraints fail

**Solution:** Run migrations in correct order - Phase 1 (master data) before Phase 3 (mappings)

### 8. Phone Encryption
**Problem:** Phone matching requires decryption, inefficient for large datasets

**Solution:** 
- Optimization: Filter by `phone_last_4_digits` at DB level first (narrowing)
- Then decrypt only filtered candidates for exact match (app level)
- Admin-created mappings: Bulk decrypt filtered users
- User registration: Efficient single-user query for unprocessed mappings
- Location: `src/mst_informal_certificate_mappings/mst_informal_certificate_mappings.service.ts`

---

## Monitoring & Logging

### Key Metrics to Track
- Education verification count per day
- Certificate verification count per day
- Skills granted per day
- Retroactive processing jobs completed
- Failed async operations (via Bull dashboard)
- Queue job processing times

### Logging Strategy
- All async operations logged with context (userId, educationId, certificateId, etc.)
- Queue job status tracked in Bull dashboard
- Error handling with stack traces
- Retroactive processing statistics logged
- Verification success rates tracked

### Logging Locations
- Service methods: Use `LoggingService` (not console.log)
- Queue processors: Use NestJS `Logger`
- Error context: Include relevant IDs and operation type

---

## Phase Quick Reference

**Phase 1:** Master data entities (mst_licenses, mst_majors, mst_school_majors) + user table updates
**Phase 2:** PIC_SCHOOL role + school_id field + scope filtering
**Phase 3:** Education-License mapping CRUD + Excel + RBAC + Approval state machine
**Phase 4:** License-Skill mapping + Informal certificate mapping + Excel
**Phase 5:** Automation flows (Education → License → Skill) + Informal processing + Pending certificates
**Phase 6:** Retroactive processing (bi-directional: mapping→users AND user→mappings)
**Phase 7:** Graceful shutdown (ShutdownService)
**Phase 8:** Centralized queue management (6 skill-match queues + 1 email queue = 7 total)

**Detailed Implementation:** See individual phase documents in `docs/3.5/implementation/`

---

## Related Documentation

- **Phase-by-Phase Guides**: See individual phase documents in `docs/3.5/implementation/`
- **Design Documents**: See root-level design documents (SKILL_MATCH_DESIGN.md, ROLE_PERMISSION_DESIGN.md, etc.)

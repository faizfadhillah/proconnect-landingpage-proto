# Skill Match System - Implementation Summary

## Overview

Sistem otomatisasi untuk matching education, certificates, dan skills berdasarkan mapping yang telah dikonfigurasi. Sistem ini memungkinkan automatic granting licenses dan skills kepada users berdasarkan verified education dan certificates.

## High-Level Flow

### 1. Master Data Foundation
- **mst_licenses**: Master data untuk licenses/certificates
- **mst_majors**: Master data untuk jurusan pendidikan
- **mst_school_majors**: Relasi antara sekolah dan jurusan
- **mst_education_license_mappings**: Mapping education (school + major + degree + diploma level) → license
- **mst_license_skill_mappings**: Mapping license → skill
- **mst_informal_certificate_mappings**: Mapping email/phone → license (untuk certificates dari external/government)

### 2. Role & Permission System
- **PIC_SCHOOL role**: Role khusus untuk PIC sekolah dengan scope filtering berdasarkan `school_id`
- **Scope filtering**: PIC_SCHOOL hanya bisa manage mappings untuk sekolah yang di-assign

### 3. Approval State System
- **WAITING_APPROVAL**: Initial state, menunggu approval
- **APPROVED**: Final state, sudah approved dan trigger automation
- **REJECT**: Final state, ditolak
- Auto-approval: Jika mapping exists → auto APPROVED, jika tidak → WAITING_APPROVAL

### 4. Automation Flows

#### 4.1 Education Verification Flow
```
User Education (APPROVED) 
  → Find matching education-license mappings
  → Grant licenses to user (via user_certificates)
  → Trigger certificate verification flow
```

**Trigger**: Admin approve education atau auto-approve jika mapping exists

#### 4.2 Certificate Verification Flow
```
User Certificate (APPROVED + has mst_license_id)
  → Find matching license-skill mappings
  → Grant skills to user (via user_skills)
```

**Trigger**: Admin approve certificate atau auto-approve jika license has mappings

#### 4.3 Informal Certificate Processing
```
Admin upload mapping (email/phone → license)
  → Find matching users
  → Grant licenses to matching users
  → Mark mapping as PROCESSED
```

**Trigger**: 
- Admin create mapping → immediate processing
- User registration/update → check unprocessed mappings

### 5. Retroactive Processing

#### 5.1 New Education-License Mapping
```
Admin create/update mapping
  → Find all verified educations matching criteria
  → Grant licenses retroactively
```

#### 5.2 New License-Skill Mapping
```
Admin create/update mapping
  → Find all verified certificates with that license
  → Grant skills retroactively
```

### 6. Queue System

Semua async processing menggunakan Bull queues:
- `education-verification`: Process education verification
- `certificate-verification`: Process certificate verification
- `informal-certificate-processing`: Process admin-uploaded informal certificates
- `informal-certificate-user-processing`: Process user registration/update
- `retroactive-education-license`: Retroactive processing for education-license mappings
- `retroactive-license-skill`: Retroactive processing for license-skill mappings

### 7. Graceful Shutdown

- **ShutdownService**: Handle SIGTERM/SIGINT signals
- Close HTTP server (stop accepting new requests)
- Close all Bull queues gracefully
- Disconnect Redis
- TypeORM handles database connection closure automatically

## Key Components

### Entities
- `mst_licenses`, `mst_majors`, `mst_school_majors`
- `mst_education_license_mappings`
- `mst_license_skill_mappings`
- `mst_informal_certificate_mappings`
- `user_educations` (with approval_state)
- `user_certificates` (with approval_state, mst_license_id)
- `user_skills` (with approval_state)

### Services
- **UserEducationsService**: Handle education CRUD + approval + verification trigger
- **UserCertificatesService**: Handle certificate CRUD + approval + verification trigger + centralized `grantVerifiedLicense()`
- **UserSkillsService**: Handle skill CRUD + approval + centralized `grantVerifiedSkill()`
- **MstEducationLicenseMappingsService**: CRUD mappings + retroactive processing
- **MstLicenseSkillMappingsService**: CRUD mappings + retroactive processing
- **MstInformalCertificateMappingsService**: CRUD mappings + processing

### Queue Processors
- 6 processors untuk handle async processing dari queues
- Semua menggunakan constants dari `queue.constants.ts` (no plain strings)

## Business Rules

1. **Final States**: APPROVED dan REJECT tidak bisa diubah
2. **Edit Restrictions**: 
   - Education: Tidak bisa edit jika APPROVED/REJECT
   - Certificate/Skill: Bisa edit meskipun APPROVED/REJECT
3. **Auto-Approval**: 
   - Education: Auto-approved jika mapping exists
   - Certificate: Auto-approved jika mst_license_id exists dan license has skill mappings
4. **Queue Triggering**: Hanya trigger jika approval_state = APPROVED

## Data Flow Diagram

```
┌─────────────────┐
│ User Education  │
│  (APPROVED)     │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────┐
│ Education-License Mapping   │
│ (Find matching licenses)    │
└────────┬────────────────────┘
         │
         ▼
┌─────────────────┐
│ User Certificate│
│  (APPROVED)     │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────┐
│ License-Skill Mapping       │
│ (Find matching skills)     │
└────────┬────────────────────┘
         │
         ▼
┌─────────────────┐
│   User Skill    │
│   (APPROVED)    │
└─────────────────┘
```

## Implementation Status

✅ **All Phases Completed:**
- Phase 1: Foundation (Master Data)
- Phase 2: Role & Permission System
- Phase 3: Education-License Mapping
- Phase 4: License-Skill & Informal Certificate Mapping
- Phase 5: Automation Flows
- Phase 6: Retroactive Processing
- Phase 7: Graceful Shutdown
- Phase 8: Queue Management
- Approval State System

## Notes

- Semua async processing menggunakan Bull queues untuk scalability
- Centralized methods (`grantVerifiedLicense`, `grantVerifiedSkill`) untuk DRY principle
- Approval state system menggantikan `is_verified` boolean (keduanya coexist untuk backward compatibility)
- Retroactive processing memastikan existing data tetap ter-update saat mapping baru dibuat
- Graceful shutdown memastikan no connection leaks saat deployment


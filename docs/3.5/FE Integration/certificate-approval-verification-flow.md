# Certificate Approval & Verification Flow

**Flow:** User creates certificate → Admin approves → Auto-grant skills

## Description

This flow shows how a user creates a certificate record, admin approves it, and the system automatically grants skills based on license-skill mappings.

## Sequence Diagram

```mermaid
sequenceDiagram
    participant FE as Frontend
    participant API as API Controller
    participant UC as UserCertificatesService
    participant Queue as Bull Queue
    participant Proc as CertificateVerificationProcessor
    participant Mapping as LicenseSkillMappingService
    participant US as UserSkillsService

    Note over FE,US: Flow: User creates certificate → Admin approves → Auto-grant skills

    FE->>API: POST /user-certificates<br/>{mst_license_id: "xxx"}
    API->>UC: create(certificateDto)
    UC->>UC: Set approval_state = WAITING_APPROVAL
    UC-->>API: Return certificate
    API-->>FE: 201 Created

    Note over FE,US: Admin reviews and approves

    FE->>API: PATCH /user-certificates/:id/approval<br/>{approval_state: APPROVED}
    API->>UC: approve(id, APPROVED, adminEmail)
    UC->>UC: Check if mst_license_id exists
    alt mst_license_id exists
        UC->>UC: Set approval_state = APPROVED<br/>approval_by = adminEmail
        UC->>Queue: Add job to CERTIFICATE_VERIFICATION_QUEUE
    end
    UC-->>API: Return updated certificate
    API-->>FE: 200 OK

    Note over FE,US: Background processing (async)

    Queue->>Proc: Process job {certificateId}
    Proc->>UC: processCertificateVerificationById(certificateId)
    UC->>UC: Find certificate by ID
    UC->>Mapping: findByLicenseId(certificate.mst_license_id)
    Mapping-->>UC: Return matching mappings[]
    
    loop For each mapping
        UC->>US: grantVerifiedSkill(userId, skillId)
        US->>US: Upsert user_skill<br/>(approval_state=APPROVED, is_verified=true)
    end
```

## Key Points

- Certificate is created with `approval_state = WAITING_APPROVAL` by default
- Admin must explicitly approve via `PATCH /user-certificates/:id/approval`
- Queue is only triggered if `mst_license_id` exists on the certificate
- Approval triggers async queue processing (non-blocking)
- System finds matching license-skill mappings based on certificate's `mst_license_id`
- For each matching mapping, a skill is automatically granted with `approval_state = APPROVED` and `is_verified = true`; FE/mobile should rely on `is_verified` for showing verified status


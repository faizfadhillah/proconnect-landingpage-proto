# Education Approval & Verification Flow

**Flow:** User creates education → Admin approves → Auto-grant licenses → Auto-grant skills

## Description

This flow shows how a user creates an education record, admin approves it, and the system automatically grants licenses (and subsequently skills) based on education-license mappings.

## Sequence Diagram

```mermaid
sequenceDiagram
    participant FE as Frontend
    participant API as API Controller
    participant UE as UserEducationsService
    participant Queue as Bull Queue
    participant Proc as EducationVerificationProcessor
    participant Mapping as EducationLicenseMappingService
    participant UC as UserCertificatesService
    participant CS as CertificateVerificationProcessor

    Note over FE,CS: Flow: User creates education → Admin approves → Auto-grant licenses

    FE->>API: POST /user-educations
    API->>UE: create(educationDto)
    UE->>UE: Set approval_state = WAITING_APPROVAL
    UE-->>API: Return education
    API-->>FE: 201 Created

    Note over FE,CS: Admin reviews and approves

    FE->>API: PATCH /user-educations/:id/approval<br/>{approval_state: APPROVED}
    API->>UE: approve(id, APPROVED, adminEmail)
    UE->>UE: Set approval_state = APPROVED<br/>approval_by = adminEmail
    UE->>Queue: Add job to EDUCATION_VERIFICATION_QUEUE
    UE-->>API: Return updated education
    API-->>FE: 200 OK

    Note over FE,CS: Background processing (async)

    Queue->>Proc: Process job {educationId}
    Proc->>UE: processEducationVerificationById(educationId)
    UE->>UE: Find education by ID
    UE->>Mapping: findByEducation(school, major, degree, diploma_level)
    Mapping-->>UE: Return matching mappings[]
    
    loop For each mapping
        UE->>UC: grantVerifiedLicense(userId, licenseId, license)
        UC->>UC: Upsert user_certificate<br/>(approval_state=APPROVED, is_verified=true)
        
        alt New certificate created
            UC->>Queue: Add job to CERTIFICATE_VERIFICATION_QUEUE
            Queue->>CS: Process certificate verification
            CS->>CS: Grant skills automatically
        end
    end
```

## Key Points

- Education is created with `approval_state = WAITING_APPROVAL` by default
- Admin must explicitly approve via `PATCH /user-educations/:id/approval`
- Approval triggers async queue processing (non-blocking)
- System finds matching education-license mappings based on: school, major, degree, diploma_level
- For each matching mapping, a certificate is automatically granted
- New certificates trigger certificate verification queue, which grants skills automatically
- FE/mobile should read verification from `is_verified` fields (certificates/skills), not from `approval_state`


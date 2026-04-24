# Retroactive Processing Flow (New Mapping Created)

**Flow:** Admin creates new mapping → System grants licenses to existing verified educations

## Description

This flow shows how when an admin creates a new education-license mapping, the system retroactively grants licenses to all existing verified educations that match the mapping criteria.

## Sequence Diagram

```mermaid
sequenceDiagram
    participant Admin as Admin (FE)
    participant API as API Controller
    participant Mapping as EducationLicenseMappingService
    participant Queue as Bull Queue
    participant Proc as RetroactiveEducationLicenseProcessor
    participant UE as UserEducationsService
    participant UC as UserCertificatesService

    Note over Admin,UC: Flow: Admin creates new mapping → System grants licenses to existing verified educations

    Admin->>API: POST /mst-education-license-mappings<br/>{school_id, major_id, degree, diploma_level, license_id}
    API->>Mapping: create(mappingDto)
    Mapping->>Mapping: Create mapping record
    Mapping->>Queue: Add job to RETROACTIVE_EDUCATION_LICENSE_QUEUE<br/>{mappingId}
    Mapping-->>API: Return mapping
    API-->>Admin: 201 Created

    Note over Admin,UC: Background processing (async)

    Queue->>Proc: Process job {mappingId}
    Proc->>Mapping: processRetroactiveMappings(mappingId)
    Mapping->>Mapping: findMatchingVerifiedEducations(mapping)
    Note over Mapping: Query: user_educations WHERE<br/>school_id = mapping.school_id<br/>AND major = mapping.major<br/>AND degree = mapping.degree<br/>AND diploma_level = mapping.diploma_level<br/>AND approval_state = APPROVED
    Mapping-->>Proc: Return matching educations[]
    
    loop For each matching education
        Mapping->>UC: grantVerifiedLicense(userId, licenseId, license)
        UC->>UC: Upsert user_certificate<br/>(approval_state=APPROVED, is_verified=true)
    end
```

## Key Points

- Triggered when admin creates new education-license mapping via `POST /mst-education-license-mappings`
- Also triggered when mapping is updated (if criteria changed) via `PUT /mst-education-license-mappings/:id`
- Queue processing is async (non-blocking)
- System searches for existing verified educations (`is_verified = true`, which is set when approval_state = APPROVED) that match the mapping criteria
- Matching criteria: school_id, major, degree, diploma_level
- For each matching education, a certificate is automatically granted
- This ensures existing users benefit from new mappings without manual intervention
- Similar flow exists for license-skill mappings (retroactive skill granting)


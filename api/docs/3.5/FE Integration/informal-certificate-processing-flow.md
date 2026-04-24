# Informal Certificate Processing Flow

**Flow:** Admin uploads mapping → System finds matching users → Auto-grant certificates

## Description

This flow shows how an admin creates an informal certificate mapping (email/phone to license), and the system automatically finds matching users and grants certificates to them.

## Sequence Diagram

```mermaid
sequenceDiagram
    participant Admin as Admin (FE)
    participant API as API Controller
    participant Mapping as InformalCertificateMappingService
    participant Queue as Bull Queue
    participant Proc as InformalCertificateProcessor
    participant UserService as UsersService
    participant UC as UserCertificatesService

    Note over Admin,UC: Flow: Admin uploads mapping → System finds matching users → Auto-grant certificates

    Admin->>API: POST /mst-informal-certificate-mappings<br/>{email: "user@example.com", license_id: "xxx"}
    API->>Mapping: create(mappingDto)
    Mapping->>Mapping: Set status = UNPROCESSED
    Mapping->>Queue: Add job to INFORMAL_CERTIFICATE_PROCESSING_QUEUE
    Mapping-->>API: Return mapping
    API-->>Admin: 201 Created

    Note over Admin,UC: Background processing (async)

    Queue->>Proc: Process job {mappingId}
    Proc->>Mapping: processMapping(mappingId)
    Mapping->>UserService: Find users by email/phone
    UserService-->>Mapping: Return matching users[]
    
    loop For each matching user
        Mapping->>UC: grantVerifiedLicense(userId, licenseId, license)
        UC->>UC: Upsert user_certificate<br/>(approval_state=APPROVED, is_verified=true)
        Mapping->>Mapping: Set status = PROCESSED
    end
```

## Key Points

- Mapping is created with `status = UNPROCESSED` by default
- Queue processing is triggered immediately upon creation
- System searches for users matching the email or phone in the mapping
- Multiple users can match (if they share the same email/phone)
- For each matching user, a certificate is automatically granted with `approval_state = APPROVED` and `is_verified = true` (FE/mobile should read `is_verified` for verified status)
- Mapping status is updated to `PROCESSED` after successful processing
- If no users match, mapping remains `UNPROCESSED` (will be processed when user registers/updates)


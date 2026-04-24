# User Registration Triggers Informal Certificate Flow

**Flow:** User registers → System checks unprocessed mappings → Auto-grant certificates

## Description

This flow shows how when a user registers (or updates email/phone), the system automatically checks for unprocessed informal certificate mappings and grants certificates if matches are found.

## Sequence Diagram

```mermaid
sequenceDiagram
    participant User as User (FE)
    participant API as API Controller
    participant UserService as UsersService
    participant Queue as Bull Queue
    participant Proc as InformalCertificateUserProcessor
    participant Mapping as InformalCertificateMappingService
    participant UC as UserCertificatesService

    Note over User,UC: Flow: User registers → System checks unprocessed mappings → Auto-grant certificates

    User->>API: POST /users/register-candidate<br/>{email: "user@example.com", phone: "+62..."}
    API->>UserService: registerCandidate(userDto)
    UserService->>UserService: Create user
    UserService->>Queue: Add job to INFORMAL_CERTIFICATE_USER_PROCESSING_QUEUE<br/>{userId, phone}
    UserService-->>API: Return user
    API-->>User: 201 Created

    Note over User,UC: Background processing (async)

    Queue->>Proc: Process job {userId, phone}
    Proc->>UserService: processInformalCertificatesForUser(userId, phone)
    UserService->>Mapping: processMappingsForUser(userId, email, phone)
    Mapping->>Mapping: findUnprocessedByEmailOrPhone(email, phone)
    Mapping-->>UserService: Return unprocessed mappings[]
    
    loop For each mapping
        Mapping->>UC: grantVerifiedLicense(userId, licenseId, license)
        UC->>UC: Upsert user_certificate<br/>(approval_state=APPROVED, is_verified=true)
        Mapping->>Mapping: Set status = PROCESSED
    end
```

## Key Points

- Triggered when user registers via `POST /users/register-candidate`
- Also triggered when user updates email/phone via `PUT /users/:id`
- Queue processing is async (non-blocking)
- System searches for unprocessed mappings matching the user's email or phone
- For each matching mapping, a certificate is automatically granted
- Mapping status is updated to `PROCESSED` after successful processing
- This ensures users get certificates even if they registered before the mapping was created


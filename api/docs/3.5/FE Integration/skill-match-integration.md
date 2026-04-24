# Skill Match Calculation - FE Integration Guide

## Overview

Skill Match adalah fitur yang menghitung persentase kecocokan skill antara job dan candidate. Calculation dilakukan **on-the-fly** (tidak disimpan ke database).

## API Endpoints

### 1. Get Job Detail (PoV Candidate)

**Endpoint:** `GET /jobs/:id`

**Description:** Get job detail dengan skill match percentage untuk candidate yang sedang login.

**Authentication:** Required (Bearer token)

**Response:**
```json
{
  "id": "job-uuid",
  "title": "Software Engineer",
  "description": "...",
  "company_id": "...",
  "status": "PUBLISH",
  // ... other job fields ...
  "skill_match": 85.5  // Number: 0-100, atau -1 jika tidak ada skills di job
}
```

**Skill Match Values:**
- `-1`: Job tidak punya skills → FE display sebagai `"- %"`
- `0-100`: Skill match percentage (0 = no match, 100 = perfect match atau auto-match via education-profession mapping)

**Example:**
```bash
GET /jobs/123e4567-e89b-12d3-a456-426614174000
Authorization: Bearer <token>
```

**Response:**
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "title": "Senior Software Engineer",
  "skill_match": 75.5
}
```

---

### 2. Search Applicants (PoV Employer)

**Endpoint:** `GET /applicants/search`

**Description:** Search applicants dengan skill match percentage untuk setiap applicant.

**Authentication:** Required (Bearer token)

**Query Parameters:**
- `filters[job_id]`: Filter by job ID (required untuk skill match calculation)
- `page`, `limit`: Pagination
- `expands`: Expand related entities
- Other standard filters

**Response:**
```json
{
  "items": [
    {
      "id": "applicant-uuid",
      "job_id": "job-uuid",
      "user_id": "user-uuid",
      "status": "CONNECT",
      // ... other applicant fields ...
      "skill_match": 90.0  // Number: 0-100, atau -1 jika tidak ada skills di job
    },
    {
      "id": "applicant-uuid-2",
      "skill_match": -1  // No skills in job
    }
  ],
  "meta": {
    "total": 10,
    "page": 1,
    "limit": 10,
    "totalPages": 1
  }
}
```

**Example:**
```bash
GET /applicants/search?filters[job_id]=123e4567-e89b-12d3-a456-426614174000&page=1&limit=10
Authorization: Bearer <token>
```

---

### 3. Get Applicant Detail (PoV Employer)

**Endpoint:** `GET /applicants/:id`

**Description:** Get applicant detail dengan skill match percentage untuk applicant tersebut (butuh job context yang sudah tercatat di applicant).

**Authentication:** Required (Bearer token)

**Response:**
```json
{
  "id": "applicant-uuid",
  "job_id": "job-uuid",
  "user_id": "user-uuid",
  "status": "CONNECT",
  // ... other applicant fields ...
  "skill_match": 88.0  // Number: 0-100, atau -1 jika job tidak punya skills
}
```

**Example:**
```bash
GET /applicants/123e4567-e89b-12d3-a456-426614174000
Authorization: Bearer <token>
```

---

## Skill Match Calculation Logic

### Formula

```
Skill Match % = ((2×V) + (1×U)) / (2×T) × 100
```

**Where:**
- `V` = Number of verified skill matches (from candidate)
- `U` = Number of unverified skill matches (from candidate)
- `T` = Total skills listed in job

### Special Cases

1. **No Skills in Job:**
   - Returns: `-1`
   - FE should display: `"- %"`

2. **Auto 100% Match:**
   - If candidate has verified education that matches job profession via `mst_education_profession_mappings`
   - Returns: `100`
   - No skill calculation needed

3. **Normal Calculation:**
   - Calculate based on skill matches (verified vs unverified)
   - Returns: `0-100` (percentage)

---

## Frontend Implementation

### Display Logic

```typescript
function formatSkillMatch(skillMatch: number): string {
  if (skillMatch === -1) {
    return "- %";
  }
  return `${skillMatch.toFixed(1)}%`;
}
```

### Example Usage

**Job Detail Page (Candidate View):**
```typescript
const job = await fetchJobDetail(jobId);
const skillMatchDisplay = formatSkillMatch(job.skill_match);
// Display: "85.5%" or "- %"
```

**Applicants List (Employer View):**
```typescript
const applicants = await fetchApplicants({ job_id: jobId });
applicants.items.forEach(applicant => {
  const skillMatchDisplay = formatSkillMatch(applicant.skill_match);
  // Display: "90.0%" or "- %"
});
```

---

## Notes

- Skill match calculation is **on-the-fly** - tidak disimpan ke database
- Calculation hanya dilakukan jika user authenticated (untuk job detail)
- Untuk applicants, skill match dihitung baik di list (`/applicants/search`) maupun detail (`/applicants/:id`)
- Verified skill = `is_verified = true` (diset otomatis saat certificate/skill di-approve atau auto-granted). FE/mobile pakai `is_verified`, jangan infer dari `approval_state`
- Verified education = `is_verified = true` (diset setelah approval education). FE/mobile juga hanya pakai `is_verified` untuk status terverifikasi


# Implementasi Pending Student Verification - Backend & Frontend

## Overview
Sistem pending student verification digunakan untuk menampung data siswa yang di-upload oleh admin tetapi belum terdaftar di sistem (belum memiliki akun user). Data ini disimpan di tabel `pending_student_verifications` dan akan otomatis terhapus ketika siswa tersebut membuat akun dan mendaftarkan pendidikan mereka.

## Arsitektur Backend

### 1. Entity: `PendingStudentVerification`
**File:** `ProConnect-API/src/user_educations/entities/pending_student_verification.entity.ts`

Entity ini menyimpan data siswa yang belum terdaftar:
- `student_id`: ID siswa (unik per sekolah)
- `school_id`: ID sekolah (required)
- `full_name`, `photo_url`, `email`, `phone_num`: Data opsional dari upload
- `major`, `major_id`: Jurusan (opsional)
- `degree`, `diploma_level`: Tingkat pendidikan

**Unique Constraint:** `[student_id, school_id, major_id, degree, diploma_level]`

### 2. Controller: `PendingStudentVerificationsController`
**File:** `ProConnect-API/src/user_educations/controller/pending_student_verifications.controller.ts`

Endpoints yang tersedia:
- `POST /pending-student-verifications` - Create pending entry
- `GET /pending-student-verifications/search` - Search dengan filters, pagination
- `PATCH /pending-student-verifications/:id` - Update pending entry
- `DELETE /pending-student-verifications/:id` - Soft delete
- `POST /pending-student-verifications/upload` - Bulk upload dari Excel
- `GET /pending-student-verifications/template/download` - Download template Excel

### 3. Endpoint Utama: `GET /user-educations/students`
**File:** `ProConnect-API/src/user_educations/controller/user_educations.controller.ts` (line 200-230)

Endpoint ini menggabungkan data dari dua sumber:
1. **User Educations** (JOINED) - Siswa yang sudah punya akun
2. **Pending Student Verifications** (NOT_JOINED) - Siswa yang belum punya akun

### 4. Service Layer: `StudentsService`
**File:** `ProConnect-API/src/user_educations/service/students.service.ts`

#### Method: `getStudents()`
Alur kerja:
1. **Query Database** - Menggunakan `StudentsDao.getStudentsGroupedWithPagination()` yang melakukan UNION query:
   ```sql
   -- Query untuk JOINED (user_educations)
   SELECT student_id, user_id, full_name, ...
   FROM user_educations ue
   LEFT JOIN users u ON ue.user_id = u.id
   WHERE ...
   
   UNION ALL
   
   -- Query untuk NOT_JOINED (pending_student_verifications)
   SELECT student_id, NULL as user_id, full_name, ...
   FROM pending_student_verifications ps
   WHERE ...
   ```

2. **Grouping** - Data di-group berdasarkan `user_id` (untuk JOINED) atau `student_id` (untuk NOT_JOINED)

3. **Verification Status Mapping**:
   - `APPROVED` → `VERIFIED`
   - `WAITING_APPROVAL` → `NEED_VERIFICATION`
   - `REJECT` → `NOT_VERIFIED`
   - Pending entries → `USER_NOT_FOUND`

4. **Account Status**:
   - `JOINED` - User sudah terdaftar (ada di user_educations)
   - `NOT_JOINED` - User belum terdaftar (hanya ada di pending_student_verifications)

5. **License Fetching**:
   - Untuk JOINED: Ambil dari `user_certificates` berdasarkan `user_id`
   - Untuk NOT_JOINED: Ambil dari `mst_education_license_mappings` berdasarkan `school_id`, `major_id`, `degree`, `diploma_level`

6. **Phone Decryption**:
   - Untuk JOINED: Decrypt dari `encrypted_user_data`
   - Untuk NOT_JOINED: Langsung dari `pending_student_verifications.phone_num`

### 5. DAO Layer: `StudentsDao`
**File:** `ProConnect-API/src/user_educations/dao/students.dao.ts`

#### Method: `getStudentsGroupedWithPagination()`
- Membangun UNION query dengan CTE (Common Table Expression)
- Filter conditions dibangun untuk kedua tabel (educations & pending)
- Grouping dilakukan di database level untuk performa optimal
- Support filtering berdasarkan:
  - `school_id`, `major_id`
  - `name` (ILIKE search)
  - `email` (ILIKE search)
  - `verification_status`
  - `account_status`

## Struktur Response

### Response DTO: `StudentStatusResponseDto`
```typescript
{
  student_ids: string[];        // Array of student IDs
  full_name?: string | null;
  photo_url?: string | null;
  email?: string | null;
  phone_num?: string | null;
  majors?: string[];            // Array of majors
  status: StudentVerificationStatus;  // VERIFIED | NEED_VERIFICATION | NOT_VERIFIED | USER_NOT_FOUND
  account_status: AccountStatus;     // JOINED | NOT_JOINED
  licenses?: StudentLicenseResponseDto[];
}
```

### Pagination Response
```typescript
{
  items: StudentStatusResponseDto[],
  meta: {
    total: number,
    page: number,
    limit: number,
    totalPages: number
  }
}
```

**Catatan:** Backend saat ini TIDAK mengembalikan `verifiedCount` dan `pendingCount` di meta, tetapi frontend mengharapkannya (line 393-394 di frontend).

## Implementasi Frontend

### File: `ProConnect-CMS/pages/admin/approvals/students/index.vue`

#### 1. Fetch Data
```javascript
const fetchStudents = async () => {
  const query = {
    ...filters,
    page: params.page,
    limit: params.limit,
  };

  const data = await $apiFetch("/user-educations/students", {
    method: "GET",
    query,
  });

  students.value = (data?.items || []).map((s) => ({
    ...s,
  }));

  meta.total = data?.meta?.total || 0;
  meta.totalPages = data?.meta?.totalPages || 1;
  meta.verifiedCount = data?.meta?.verifiedCount ?? null;  // ⚠️ Backend tidak return ini
  meta.pendingCount = data?.meta?.pendingCount ?? null;    // ⚠️ Backend tidak return ini
};
```

#### 2. Filter Options
- **Name/Email**: Text search (case-insensitive)
- **Major**: Dropdown dari `/user-educations/get-available-majors/current-school`
- **Verification Status**: 
  - `VERIFIED`
  - `NEED_VERIFICATION`
  - `NOT_VERIFIED`
  - `USER_NOT_FOUND`

#### 3. Display Status
Frontend menampilkan status verification dengan chip berwarna:
- **VERIFIED** → Green chip
- **NEED_VERIFICATION** → Amber chip
- **USER_NOT_FOUND** → Grey chip
- **NOT_VERIFIED** → Grey chip

#### 4. Actions (TODO - Belum diimplementasi)
- **Verify**: `handleVerify(item)` - TODO
- **Unverify**: `handleUnverify(item)` - TODO
- **View Detail**: `openDetail(item)` - TODO

## Flow Verifikasi

### Untuk JOINED Students (User sudah terdaftar)
Verifikasi dilakukan melalui endpoint:
```
PATCH /user-educations/:id/approval
Body: { approval_state: "APPROVED" | "REJECT" }
```

**Contoh implementasi** (dari `user-educations/index.vue`):
```javascript
const handleApprove = async () => {
  await $apiFetch(`/user-educations/${selectedItem.value.id}/approval`, {
    method: "PATCH",
    body: {
      approval_state: "APPROVED",
    },
  });
};
```

### Untuk NOT_JOINED Students (Pending)
Pending entries tidak bisa di-verify langsung karena user belum terdaftar. Mereka akan otomatis ter-verify ketika:
1. User membuat akun
2. User membuat `user_education` dengan `student_id` dan `school_id` yang sama
3. Sistem otomatis:
   - Set `approval_state = APPROVED`
   - Set `approval_by = 'system'`
   - Set `is_verified = true`
   - Hapus entry dari `pending_student_verifications`
   - Trigger education verification queue

## Mapping Status

| Source | Condition | Verification Status | Account Status |
|--------|-----------|---------------------|----------------|
| `user_educations` | `approval_state = 'APPROVED'` | `VERIFIED` | `JOINED` |
| `user_educations` | `approval_state = 'WAITING_APPROVAL'` | `NEED_VERIFICATION` | `JOINED` |
| `user_educations` | `approval_state = 'REJECT'` | `NOT_VERIFIED` | `JOINED` |
| `pending_student_verifications` | (always) | `USER_NOT_FOUND` | `NOT_JOINED` |

## Catatan Penting

1. **Pending entries tidak bisa di-verify manual** - Mereka akan otomatis ter-verify ketika user mendaftar
2. **Backend tidak return `verifiedCount` dan `pendingCount`** - Frontend mengharapkan ini tapi backend tidak menyediakan. Perlu dihitung di frontend atau ditambahkan di backend
3. **License fetching berbeda**:
   - JOINED: Dari `user_certificates` (actual certificates)
   - NOT_JOINED: Dari `mst_education_license_mappings` (potential licenses berdasarkan education criteria)
4. **Phone number handling**:
   - JOINED: Perlu decrypt dari `encrypted_user_data`
   - NOT_JOINED: Langsung dari table (plain text)

## Rekomendasi Implementasi Frontend

### 1. Implement Verify/Unverify untuk JOINED Students
```javascript
const handleVerify = async (item) => {
  if (item.account_status === 'NOT_JOINED') {
    // Pending students tidak bisa di-verify manual
    alert('Pending students will be automatically verified when they register');
    return;
  }

  // Find user_education ID from item
  // Need to fetch user_educations first or store the ID in response
  try {
    await $apiFetch(`/user-educations/${item.user_education_id}/approval`, {
      method: "PATCH",
      body: {
        approval_state: "APPROVED",
      },
    });
    fetchStudents(); // Refresh
  } catch (error) {
    console.error("Error verifying:", error);
  }
};
```

### 2. Calculate verifiedCount dan pendingCount di Frontend
```javascript
const summaryCards = computed(() => {
  const verifiedCount = students.value.filter(s => s.status === 'VERIFIED').length;
  const pendingCount = students.value.filter(s => s.status === 'USER_NOT_FOUND').length;
  
  return [
    { label: "Total Members", value: meta.total },
    { label: "Verified Students", value: verifiedCount },
    { label: "Verification Pending", value: pendingCount },
    { label: "Showing Members", value: students.value.length },
  ];
});
```

### 3. Handle Display untuk Multiple Student IDs
Response bisa memiliki multiple `student_ids` dalam satu row (jika user punya multiple educations). Frontend perlu handle ini:
```javascript
// Display first student_id or all
const displayStudentId = item.student_ids?.length > 0 
  ? item.student_ids[0] 
  : '-';
```

## Testing

Untuk test pending student verification:
1. Upload Excel dengan data siswa yang belum terdaftar
2. Data akan muncul di `/user-educations/students` dengan status `USER_NOT_FOUND`
3. Ketika user tersebut register dan create education, entry pending akan otomatis terhapus dan education akan auto-approved




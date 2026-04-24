import { ApiProperty } from "@nestjs/swagger";

export class OrphanEmailDto {
  @ApiProperty({
    description: "Firebase UID",
    example: "mXM8iPgjXSPno1D0f7oVO5csZao1",
  })
  uid: string;

  @ApiProperty({
    description: "Email address",
    example: "user@example.com",
  })
  email: string;

  @ApiProperty({
    description: "Email verification status",
    example: true,
  })
  emailVerified: boolean;

  @ApiProperty({
    description: "Account creation time",
    example: "2024-01-15T10:30:00.000Z",
  })
  creationTime: string;

  @ApiProperty({
    description: "Last sign in time",
    example: "2024-01-20T14:45:00.000Z",
    nullable: true,
  })
  lastSignInTime: string | null;

  @ApiProperty({
    description: "Custom claims assigned to user",
    example: { role: "user" },
  })
  customClaims: any;

  @ApiProperty({
    description: "Account disabled status",
    example: false,
  })
  disabled: boolean;
}

export class OrphanEmailsResponseDto {
  @ApiProperty({
    description: "List of orphan emails",
    type: [OrphanEmailDto],
  })
  orphanEmails: OrphanEmailDto[];

  @ApiProperty({
    description: "Total number of orphan emails found",
    example: 15,
  })
  totalOrphans: number;

  @ApiProperty({
    description: "Total number of users in Firebase Auth",
    example: 1000,
  })
  totalFirebaseUsers: number;

  @ApiProperty({
    description: "Total number of users in system database",
    example: 985,
  })
  totalSystemUsers: number;
}

export class DeleteFirebaseUserResponseDto {
  @ApiProperty({
    description: "Operation success status",
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: "Operation result message",
    example: "User with UID xyz123 successfully deleted from Firebase Auth",
  })
  message: string;
}

export class BulkDeleteFirebaseUsersResponseDto {
  @ApiProperty({
    description: "Number of successfully deleted users",
    example: 8,
  })
  successCount: number;

  @ApiProperty({
    description: "Number of failed deletions",
    example: 2,
  })
  failureCount: number;

  @ApiProperty({
    description: "List of errors for failed deletions",
    type: [Object],
    example: [
      { uid: "uid1", error: "User not found" },
      { uid: "uid2", error: "Permission denied" },
    ],
  })
  errors: Array<{ uid: string; error: string }>;
}

export class CreateFirebaseUserResponseDto {
  @ApiProperty({
    description: "Operation success status",
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: "Operation result message",
    example: "Firebase user successfully created for user@example.com",
  })
  message: string;

  @ApiProperty({
    description: "Firebase UID of created user",
    example: "mXM8iPgjXSPno1D0f7oVO5csZao1",
    required: false,
  })
  firebase_uid?: string;
}

export class BulkCreateFirebaseUsersResponseDto {
  @ApiProperty({
    description: "Number of successfully created users",
    example: 8,
  })
  successCount: number;

  @ApiProperty({
    description: "Number of failed creations",
    example: 2,
  })
  failureCount: number;

  @ApiProperty({
    description: "List of errors for failed creations",
    type: [Object],
    example: [
      { userId: "uuid1", error: "User not found" },
      { userId: "uuid2", error: "Email already exists" },
    ],
  })
  errors: Array<{ userId: string; error: string }>;
}

export const UPLOAD_BATCH_ROW_TYPES = {
  CANDIDATE_REGISTRATION: 'CANDIDATE_REGISTRATION',
} as const;

export type UploadBatchRowType = typeof UPLOAD_BATCH_ROW_TYPES[keyof typeof UPLOAD_BATCH_ROW_TYPES];

export interface CandidateRegistrationData {
  email: string;
  name: string;
  phone: string;
  gender: string;
}


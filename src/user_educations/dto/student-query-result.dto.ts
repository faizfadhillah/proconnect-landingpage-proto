export interface EducationDetail {
  major: string;
  degree: string | null;
  diploma_level: string | null;
  institution_name: string;
}

export class StudentQueryResultDto {
  user_id: string | null;
  student_ids: string[]; // Array of student_ids (aggregated from DB)
  full_name: string | null;
  photo_url: string | null;
  email: string | null;
  phone_num: string | null;
  majors: string[]; // Array of majors (aggregated from DB)
  educations?: EducationDetail[] | string; // Array of education details (JSON from DB)
  school_id: string | null;
  major_id: string | null;
  degree: string | null;
  diploma_level: string | null;
  status: string;
  account_status: string;
}

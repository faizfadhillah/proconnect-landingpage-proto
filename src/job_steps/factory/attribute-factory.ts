import {
  InterviewAttributes,
  DetailFulfillmentItem,
  QuestionnaireAttributes,
  TestPsychoTest,
  JobStepType,
} from "../entities/job_step.entity";

export class JobStepAttributeFactory {
  static createInterviewAttributes(): InterviewAttributes {
    return {
      recipient_to: "",
      recipient_bcc: "",
      pic_name: "",
      pic_phone_number: "",
      pic_email: "",
      interviewer_list: [
        {
          name: "",
          phone_number: "",
          email: "",
          is_show: true,
        },
      ],
      interview_date_time: "",
      interview_timezone: "",
      interview_type: "",
      link_online: "",
      link_offline: "",
      offline_region_id: "",
      offline_is_outside_indo: "",
      offline_other_country: "",
      offline_other_region: "",
      offline_address: "",
      notes_applicant_interview: "",
      notes_interview_results: "",
      attachment_interview_results: "",
      reschedule_request: "",
      reschedule_request_notes_from_candidate: "",
    };
  }

  static createDetailFulfillmentAttributes(): DetailFulfillmentItem[] {
    return [
      {
        id: "1",
        name: "PERSONAL_RESUME",
        state: "1",
        notes: "Upload CV dalam bentuk pdf",
      },
      {
        id: "2",
        name: "CAREER_HISTORY",
        state: "1",
        notes: "Pengalaman kerja di perhotelan min 2 tahun",
      },
      {
        id: "3",
        name: "EDUCATION_HISTORY",
        state: "1",
        notes:
          "Diutamakan latar belakang pendidikan dari jurusan perhotelan atau sejenis",
      },
      {
        id: "4",
        name: "LICENSE_CERTIFICATE",
        state: "0",
        notes: null,
      },
      {
        id: "5",
        name: "SKILL_LANGUAGE",
        state: "0",
        notes: null,
      },
      {
        id: "6",
        name: "WORK_PREFERENCE",
        state: "1",
        notes: "Diutamakan ON-SITE",
      },
      {
        id: "7",
        name: "RIGHT_TO_WORK",
        state: "1",
        notes:
          "Diutamakan memiliki kewarganegaraan Indonesia atau izin bekerja di Indonesia",
      },
      {
        id: "8",
        name: "INTEREST",
        state: "0",
        notes: null,
      },
      {
        id: "9",
        name: "SALARY_EXPECTATION",
        state: "1",
        notes: "Salary yang ditawarkan dalam mata uang Rupiah (IDR) per-bulan",
      },
      {
        id: "10",
        name: "ASEAN_SKILL_PASSPORT",
        state: "1",
        notes: "Diutamakan memiliki ASEAN SKILL PASSPORT",
      },
    ];
  }

  static createQuestionnaireAttributes(): QuestionnaireAttributes {
    return {};
  }

  static createTestPsychoAttributes(): TestPsychoTest[] {
    return [
      {
        test_id: "1",
        test_type: "FILE",
        test_name: null,
        test_description: null,
        test_file_employer: null,
        test_file_candidate: null,
        test_result_notes: null,
        test_result_file: null,
        test_url: null,
        test_candidate_confirmed: false,
        test_candidate_input_name: null,
      },
    ];
  }

  // Factory method utama yang menggunakan mapping berdasarkan type
  static createAttributes(type: JobStepType): any {
    const attributeMap = {
      [JobStepType.INTERVIEW]: () => this.createInterviewAttributes(),
      [JobStepType.DETAIL_FULFILLMENT]: () =>
        this.createDetailFulfillmentAttributes(),
      [JobStepType.QUESTIONNAIRE]: () => this.createQuestionnaireAttributes(),
      [JobStepType.TEST_PSYCHO]: () => this.createTestPsychoAttributes(),
      [JobStepType.SYS_SHORTLIST]: () => null,
      [JobStepType.SYS_HIRED]: () => null,
    };

    const factory = attributeMap[type];
    return factory ? factory() : null;
  }
}

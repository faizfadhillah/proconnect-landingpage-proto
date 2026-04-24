import { Injectable } from "@nestjs/common";
import { FirebaseService } from "src/firebase/firebase.service";
import { LoggingService } from "src/logs/logs.service";
import { User } from "./entities/user.entity";
import { Job } from "src/jobs/entities/job.entity";
import { MstCompany } from "src/mst_companies/entities/mst_company.entity";
import { Applicant } from "src/applicants/entities/applicant.entity";
import * as moment from "moment-timezone";

@Injectable()
export class NotificationService {
  constructor(
    private readonly firebaseService: FirebaseService,
    private readonly loggingService: LoggingService,
  ) {}

  /**
   * Format date time to display with AM/PM format
   * @param dateTimeString - The date time string to format
   * @returns Formatted date time string with AM/PM
   */
  private formatDateTime(dateTimeString: string): string {
    try {
      const dateTime = moment(dateTimeString);
      if (!dateTime.isValid()) {
        return dateTimeString; // Return original if invalid
      }

      // Format: "Monday, January 15, 2024 at 2:30 PM"
      return dateTime.format("dddd, MMMM DD, YYYY [at] h:mm A");
    } catch (error) {
      this.loggingService.error(
        `Error formatting date time: ${dateTimeString}`,
        "email",
        error,
      );
      return dateTimeString; // Return original if error
    }
  }

  async sendPushNotification(uid: string, payload: any, data?: any) {
    try {
      await this.firebaseService.sendPushNotification(uid, payload, data);
    } catch (error) {
      this.loggingService.error(
        `Failed to send push notification to uid: ${uid}`,
        "notification",
        error.stack,
      );
    }
  }

  // Notification when candidate connects/applies to a job
  async sendCandidateConnectedNotification(
    candidate: User,
    job: Job,
    company: MstCompany,
    applicant: Applicant,
  ) {
    const payload = {
      notification: {
        title: "You Have Connected",
        body: `Hi ${candidate.full_name}, you have applied as a ${job.title} at ${company.company_name}`,
        image: company.logo_url,
      },
      data: {
        entity: "applicant",
        id: applicant.id,
      },
    };

    await this.sendPushNotification(candidate.firebase_uid, payload, {
      applicant,
    });
  }

  // Notification to company users when new candidate applies
  async sendNewCandidateAppliedNotification(
    companyUser: User,
    candidate: User,
    job: Job,
    applicant: Applicant,
  ) {
    const payload = {
      notification: {
        title: "New Candidate Applied",
        body: `${candidate.full_name} has applied as a ${job.title}`,
        image: candidate.photo_url,
      },
      data: {
        entity: "applicant",
        id: applicant.id,
      },
    };

    await this.sendPushNotification(companyUser.firebase_uid, payload, {
      applicant,
    });
  }

  // Notification when job application status is updated
  async sendJobApplicationStatusUpdateNotification(
    candidate: User,
    job: Job,
    company: MstCompany,
    applicant: Applicant,
  ) {
    const payload = {
      notification: {
        title: "Job Application Status Updated",
        body: `Your applied job for ${job.title} has been updated to ${applicant.status}`,
        image: company.logo_url,
      },
      data: {
        entity: "applicant",
        id: applicant.id,
      },
    };

    await this.sendPushNotification(candidate.firebase_uid, payload, {
      applicant,
    });
  }

  // Generic notification for job step updates
  async sendJobStepUpdateNotification(
    user: User,
    title: string,
    body: string,
    imageUrl?: string,
    data?: any,
  ) {
    const payload = {
      notification: {
        title,
        body,
        image: imageUrl,
      },
      data: data || {},
    };

    await this.sendPushNotification(user.firebase_uid, payload, data);
  }

  // Notification for interview scheduled
  async sendInterviewScheduledNotification(
    candidate: User,
    job: Job,
    company: MstCompany,
    interviewDetails: {
      date: string;
      time: string;
      type: "online" | "offline";
      location?: string;
    },
  ) {
    const payload = {
      notification: {
        title: "Interview Scheduled",
        body: `Your interview for ${job.title} at ${company.company_name} has been scheduled for ${interviewDetails.date} at ${interviewDetails.time}`,
        image: company.logo_url,
      },
      data: {
        entity: "interview",
        jobId: job.id,
        type: interviewDetails.type,
      },
    };

    await this.sendPushNotification(candidate.firebase_uid, payload, {
      interviewDetails,
      job,
      company,
    });
  }

  // Notification for questionnaire available
  async sendQuestionnaireAvailableNotification(
    candidate: User,
    job: Job,
    company: MstCompany,
  ) {
    const payload = {
      notification: {
        title: "Questionnaire Available",
        body: `Please complete the questionnaire for ${job.title} at ${company.company_name}`,
        image: company.logo_url,
      },
      data: {
        entity: "job",
        id: job.id,
      },
    };

    await this.sendPushNotification(candidate.firebase_uid, payload, {
      job,
      company,
    });
  }

  // Notification for data fulfillment required
  async sendDataFulfillmentRequiredNotification(
    candidate: User,
    job: Job,
    company: MstCompany,
  ) {
    const payload = {
      notification: {
        title: "Additional Information Required",
        body: `Please complete your data fulfillment for ${job.title} at ${company.company_name}`,
        image: company.logo_url,
      },
      data: {
        entity: "job",
        id: job.id,
      },
    };

    await this.sendPushNotification(candidate.firebase_uid, payload, {
      job,
      company,
    });
  }

  // Notification for shortlisted candidates
  async sendShortlistedNotification(
    candidate: User,
    job: Job,
    company: MstCompany,
  ) {
    const payload = {
      notification: {
        title: "Congratulations! You've Been Shortlisted",
        body: `You have been shortlisted for ${job.title} at ${company.company_name}`,
        image: company.logo_url,
      },
      data: {
        entity: "job",
        id: job.id,
      },
    };

    await this.sendPushNotification(candidate.firebase_uid, payload, {
      job,
      company,
    });
  }

  // Notification for job offer
  async sendJobOfferNotification(
    candidate: User,
    job: Job,
    company: MstCompany,
    offerDetails?: any,
  ) {
    const payload = {
      notification: {
        title: "Job Offer Received!",
        body: `Congratulations! You have received a job offer for ${job.title} at ${company.company_name}`,
        image: company.logo_url,
      },
      data: {
        entity: "job",
        id: job.id,
      },
    };

    await this.sendPushNotification(candidate.firebase_uid, payload, {
      job,
      company,
      offerDetails,
    });
  }

  // Notification for rejection
  async sendRejectionNotification(
    candidate: User,
    job: Job,
    company: MstCompany,
    stage?: string,
  ) {
    const payload = {
      notification: {
        title: "Application Update",
        body: `Thank you for your interest in ${job.title} at ${company.company_name}. Unfortunately, we have decided not to move forward with your application.`,
        image: company.logo_url,
      },
      data: {
        entity: "job",
        id: job.id,
      },
    };

    await this.sendPushNotification(candidate.firebase_uid, payload, {
      job,
      company,
      stage,
    });
  }

  // Notification for employers about candidate updates
  async sendEmployerCandidateUpdateNotification(
    employer: User,
    candidate: User,
    job: Job,
    updateType: string,
    message: string,
  ) {
    const payload = {
      notification: {
        title: `Candidate ${updateType}`,
        body: message,
        image: candidate.photo_url,
      },
      data: {
        entity: "candidate",
        id: candidate.id,
        jobId: job.id,
      },
    };

    await this.sendPushNotification(employer.firebase_uid, payload, {
      candidate,
      job,
      updateType,
    });
  }

  // Batch notification sender for multiple users
  async sendBatchNotifications(users: User[], payload: any, data?: any) {
    const notifications = users.map((user) =>
      this.sendPushNotification(user.firebase_uid, payload, data),
    );

    try {
      await Promise.all(notifications);
      this.loggingService.log(
        `Batch notifications sent successfully to ${users.length} users`,
        "notification",
      );
    } catch (error) {
      this.loggingService.error(
        `Failed to send batch notifications to ${users.length} users`,
        "notification",
        error.stack,
      );
    }
  }

  // 1. OTP Registration Notification
  async sendOtpRegistrationNotification(user: User, otp: string) {
    const payload = {
      notification: {
        title: "Email Verification Required",
        body: `Your OTP code is ${otp}. Valid for 5 minutes.`,
      },
      data: {
        entity: "otp_verification",
        type: "registration",
      },
    };

    await this.sendPushNotification(user.firebase_uid, payload, { otp });
  }

  // 2. Password Reset Notification
  async sendPasswordResetNotification(user: User) {
    const payload = {
      notification: {
        title: "Password Reset Request",
        body: "A password reset request has been sent to your email.",
      },
      data: {
        entity: "password_reset",
      },
    };

    await this.sendPushNotification(user.firebase_uid, payload);
  }

  // 3. Company Role Change Notification
  async sendCompanyRoleChangeNotification(user: User, company: MstCompany) {
    const payload = {
      notification: {
        title: "Role Updated",
        body: `Your role has been changed to ${user.company_role} at ${company.company_name}`,
        image: company.logo_url,
      },
      data: {
        entity: "user",
        id: user.id,
      },
    };

    await this.sendPushNotification(user.firebase_uid, payload, {
      company,
      user,
    });
  }

  // 4 send credentials for newt staff of company

  // 5. Job Application Received Notification
  async sendJobApplicationReceivedNotification(
    candidate: User,
    job: Job,
    company: MstCompany,
  ) {
    const payload = {
      notification: {
        title: "Application Received",
        body: `Your application for ${job.title} at ${company.company_name} has been received`,
        image: company.logo_url,
      },
      data: {
        entity: "job",
        jobId: job.id,
      },
    };

    await this.sendPushNotification(candidate.firebase_uid, payload, {
      job,
      company,
    });
  }

  // 6. Shortlist Accepted Notification
  async sendShortlistAcceptedNotification(
    candidate: User,
    job: Job,
    company: MstCompany,
  ) {
    const payload = {
      notification: {
        title: "Congratulations! You've Been Shortlisted",
        body: `You have been shortlisted for ${job.title} at ${company.company_name}`,
        image: company.logo_url,
      },
      data: {
        entity: "job",
        jobId: job.id,
      },
    };

    await this.sendPushNotification(candidate.firebase_uid, payload, {
      job,
      company,
    });
  }

  // 7. View Questionnaire Notification
  async sendViewQuestionnaireNotification(
    candidate: User,
    job: Job,
    company: MstCompany,
  ) {
    const payload = {
      notification: {
        title: "Questionnaire Available",
        body: `Please complete the questionnaire for ${job.title} at ${company.company_name}`,
        image: company.logo_url,
      },
      data: {
        entity: "job",
        id: job.id,
      },
    };

    await this.sendPushNotification(candidate.firebase_uid, payload, {
      job,
      company,
    });
  }

  // 8. Questionnaire Submitted Notification
  async sendQuestionnaireSubmittedNotification(
    candidate: User,
    job: Job,
    company: MstCompany,
  ) {
    const payload = {
      notification: {
        title: "Questionnaire Submitted",
        body: `Your questionnaire for ${job.title} has been submitted successfully`,
        image: company.logo_url,
      },
      data: {
        entity: "job",
        id: job.id,
      },
    };

    await this.sendPushNotification(candidate.firebase_uid, payload, {
      job,
      company,
    });
  }

  // 9. Questionnaire Accepted Notification
  async sendQuestionnaireAcceptedNotification(
    candidate: User,
    job: Job,
    company: MstCompany,
  ) {
    const payload = {
      notification: {
        title: "Questionnaire Accepted",
        body: `Your questionnaire for ${job.title} at ${company.company_name} has been accepted`,
        image: company.logo_url,
      },
      data: {
        entity: "job",
        id: job.id,
      },
    };

    await this.sendPushNotification(candidate.firebase_uid, payload, {
      job,
      company,
    });
  }

  // 10. Questionnaire Needs Revision Notification
  async sendQuestionnaireNeedsRevisionNotification(
    candidate: User,
    job: Job,
    company: MstCompany,
  ) {
    const payload = {
      notification: {
        title: "Revision Required",
        body: `Please revise your questionnaire for ${job.title}`,
        image: company.logo_url,
      },
      data: {
        entity: "job",
        id: job.id,
      },
    };

    await this.sendPushNotification(candidate.firebase_uid, payload, {
      job,
      company,
    });
  }

  // 11. View Data Fulfillment Notification
  async sendViewDataFulfillmentNotification(
    candidate: User,
    job: Job,
    company: MstCompany,
  ) {
    const payload = {
      notification: {
        title: "Data Fulfillment Required",
        body: `Please complete your data fulfillment for ${job.title}`,
        image: company.logo_url,
      },
      data: {
        entity: "job",
        id: job.id,
      },
    };

    await this.sendPushNotification(candidate.firebase_uid, payload, {
      job,
      company,
    });
  }

  // 12. Data Fulfillment Submitted Notification
  async sendDataFulfillmentSubmittedNotification(
    candidate: User,
    job: Job,
    company: MstCompany,
  ) {
    const payload = {
      notification: {
        title: "Data Submitted Successfully",
        body: `Your data for ${job.title} has been submitted and is under review`,
        image: company.logo_url,
      },
      data: {
        entity: "job",
        id: job.id,
      },
    };

    await this.sendPushNotification(candidate.firebase_uid, payload, {
      job,
      company,
    });
  }

  // 13. Data Fulfillment Accepted Notification
  async sendDataFulfillmentAcceptedNotification(
    candidate: User,
    job: Job,
    company: MstCompany,
  ) {
    const payload = {
      notification: {
        title: "Data Fulfillment Accepted",
        body: `Your submitted data for ${job.title} has been accepted`,
        image: company.logo_url,
      },
      data: {
        entity: "job",
        id: job.id,
      },
    };

    await this.sendPushNotification(candidate.firebase_uid, payload, {
      job,
      company,
    });
  }

  // 14. Data Fulfillment Needs Revision Notification
  async sendDataFulfillmentNeedsRevisionNotification(
    candidate: User,
    job: Job,
    company: MstCompany,
  ) {
    const payload = {
      notification: {
        title: "Revision Required",
        body: `Please revise your data submission for ${job.title}`,
        image: company.logo_url,
      },
      data: {
        entity: "job",
        id: job.id,
      },
    };

    await this.sendPushNotification(candidate.firebase_uid, payload, {
      job,
      company,
    });
  }

  // 15. Interview Schedule Offline Notification
  async sendInterviewScheduleOfflineNotification(
    candidate: User,
    job: Job,
    company: MstCompany,
    interviewDetails: {
      scheduledDateTime: string;
      location: string;
      mapsLink: string;
    },
  ) {
    const formattedDateTime = this.formatDateTime(
      interviewDetails.scheduledDateTime,
    );

    const payload = {
      notification: {
        title: "Interview Scheduled",
        body: `Offline interview for ${job.title} scheduled on ${formattedDateTime}`,
        image: company.logo_url,
      },
      data: {
        entity: "job",
        type: "offline",
        id: job.id,
      },
    };

    await this.sendPushNotification(candidate.firebase_uid, payload, {
      job,
      company,
      interviewDetails,
    });
  }

  // 16. Interview Schedule Online Notification
  async sendInterviewScheduleOnlineNotification(
    candidate: User,
    job: Job,
    company: MstCompany,
    interviewDetails: {
      scheduledDateTime: string;
      onlineMeetingLink: string;
    },
  ) {
    const formattedDateTime = this.formatDateTime(
      interviewDetails.scheduledDateTime,
    );

    const payload = {
      notification: {
        title: "Interview Scheduled",
        body: `Online interview for ${job.title} scheduled on ${formattedDateTime}`,
        image: company.logo_url,
      },
      data: {
        entity: "job",
        type: "online",
        id: job.id,
      },
    };

    await this.sendPushNotification(candidate.firebase_uid, payload, {
      job,
      company,
      interviewDetails,
    });
  }

  // 17. Interview Reschedule Request Sent Notification
  async sendInterviewRescheduleRequestSentNotification(
    candidate: User,
    job: Job,
    company: MstCompany,
  ) {
    const payload = {
      notification: {
        title: "Reschedule Request Sent",
        body: `Your interview reschedule request for ${job.title} has been sent`,
        image: company.logo_url,
      },
      data: {
        entity: "job",
        id: job.id,
      },
    };

    await this.sendPushNotification(candidate.firebase_uid, payload, {
      job,
      company,
    });
  }

  // 18. Interview Reschedule Approved Offline Notification
  async sendInterviewRescheduleApprovedOfflineNotification(
    candidate: User,
    job: Job,
    company: MstCompany,
    newScheduleDetails: {
      newScheduledDateTime: string;
      location: string;
    },
  ) {
    const formattedDateTime = this.formatDateTime(
      newScheduleDetails.newScheduledDateTime,
    );

    const payload = {
      notification: {
        title: "Reschedule Approved",
        body: `Your interview for ${job.title} has been rescheduled to ${formattedDateTime}`,
        image: company.logo_url,
      },
      data: {
        entity: "job",
        type: "offline",
        id: job.id,
      },
    };

    await this.sendPushNotification(candidate.firebase_uid, payload, {
      job,
      company,
      newScheduleDetails,
    });
  }

  // 19. Interview Reschedule Approved Online Notification
  async sendInterviewRescheduleApprovedOnlineNotification(
    candidate: User,
    job: Job,
    company: MstCompany,
    newScheduleDetails: {
      newScheduledDateTime: string;
      onlineMeetingLink: string;
    },
  ) {
    const formattedDateTime = this.formatDateTime(
      newScheduleDetails.newScheduledDateTime,
    );

    const payload = {
      notification: {
        title: "Reschedule Approved",
        body: `Your interview for ${job.title} has been rescheduled to ${formattedDateTime}`,
        image: company.logo_url,
      },
      data: {
        entity: "job",
        type: "online",
        id: job.id,
      },
    };

    await this.sendPushNotification(candidate.firebase_uid, payload, {
      job,
      company,
      newScheduleDetails,
    });
  }

  // 20. Interview Reschedule Rejected Notification
  async sendInterviewRescheduleRejectedNotification(
    candidate: User,
    job: Job,
    company: MstCompany,
  ) {
    const payload = {
      notification: {
        title: "Reschedule Request Rejected",
        body: `Your reschedule request for ${job.title} has been declined`,
        image: company.logo_url,
      },
      data: {
        entity: "job",
        id: job.id,
      },
    };

    await this.sendPushNotification(candidate.firebase_uid, payload, {
      job,
      company,
    });
  }

  // 21. Interview Result Accepted Notification
  async sendInterviewResultAcceptedNotification(
    candidate: User,
    job: Job,
    company: MstCompany,
  ) {
    const payload = {
      notification: {
        title: "Congratulations!",
        body: `You have passed the interview for ${job.title} at ${company.company_name}`,
        image: company.logo_url,
      },
      data: {
        entity: "job",
        result: "accepted",
        id: job.id,
      },
    };

    await this.sendPushNotification(candidate.firebase_uid, payload, {
      job,
      company,
    });
  }

  // 22. Hired Notification Accepted
  async sendHiredNotificationAcceptedNotification(
    candidate: User,
    job: Job,
    company: MstCompany,
  ) {
    const payload = {
      notification: {
        title: "Congratulations! You're Hired!",
        body: `${company.company_name} has confirmed your hiring for the ${job.title} role`,
        image: company.logo_url,
      },
      data: {
        entity: "job",
        result: "accepted",
        id: job.id,
      },
    };

    await this.sendPushNotification(candidate.firebase_uid, payload, {
      job,
      company,
    });
  }

  // 23. Hired Notification Rejected
  async sendHiredNotificationRejectedNotification(
    candidate: User,
    job: Job,
    company: MstCompany,
  ) {
    const payload = {
      notification: {
        title: "Application Update",
        body: `Thank you for your interest in ${job.title} at ${company.company_name}. Your application was not successful.`,
        image: company.logo_url,
      },
      data: {
        entity: "job",
        result: "rejected",
        id: job.id,
      },
    };

    await this.sendPushNotification(candidate.firebase_uid, payload, {
      job,
      company,
    });
  }

  // 24. Interview Set Schedule Employer Notification
  async sendInterviewSetScheduleEmployerNotification(
    stage: string,
    employer: User,
    candidate: User,
    job: Job,
    company: MstCompany,
  ) {
    const payload = {
      notification: {
        title: "Action Required",
        body: `Please set interview schedule for ${candidate.full_name} applying for ${job.title} - ${stage}`,
        image: candidate.photo_url,
      },
      data: {
        entity: "job",
        id: job.id,
      },
    };

    await this.sendPushNotification(employer.firebase_uid, payload, {
      candidate,
      job,
      company,
    });
  }

  // 25. Move Candidate Stage Notification
  async sendMoveCandidateStageNotification(
    candidate: User,
    job: Job,
    company: MstCompany,
    newStage: string,
  ) {
    const payload = {
      notification: {
        title: "Application Status Update",
        body: `Your application for ${job.title} has been moved to: ${newStage}`,
        image: company.logo_url,
      },
      data: {
        entity: "candidate_stage_move",
        newStage,
        id: job.id,
      },
    };

    await this.sendPushNotification(candidate.firebase_uid, payload, {
      job,
      company,
      newStage,
    });
  }

  // 26. View Test Psycho Notification
  async sendViewTestPsychoNotification(
    candidate: User,
    job: Job,
    company: MstCompany,
  ) {
    const payload = {
      notification: {
        title: "Test Available",
        body: `Please complete your test submission for ${job.title} at ${company.company_name}`,
        image: company.logo_url,
      },
      data: {
        entity: "job",
        id: job.id,
      },
    };

    await this.sendPushNotification(candidate.firebase_uid, payload, {
      job,
      company,
    });
  }

  // 27. Test Psycho Submitted Notification
  async sendTestPsychoSubmittedNotification(
    candidate: User,
    job: Job,
    company: MstCompany,
  ) {
    const payload = {
      notification: {
        title: "Test Submitted Successfully",
        body: `Your test submission for ${job.title} has been submitted and is under review`,
        image: company.logo_url,
      },
      data: {
        entity: "job",
        id: job.id,
      },
    };

    await this.sendPushNotification(candidate.firebase_uid, payload, {
      job,
      company,
    });
  }

  // 28. Test Psycho Accepted Notification
  async sendTestPsychoAcceptedNotification(
    candidate: User,
    job: Job,
    company: MstCompany,
  ) {
    const payload = {
      notification: {
        title: "Test Accepted!",
        body: `Your test submission for ${job.title} at ${company.company_name} has been accepted`,
        image: company.logo_url,
      },
      data: {
        entity: "job",
        id: job.id,
      },
    };

    await this.sendPushNotification(candidate.firebase_uid, payload, {
      job,
      company,
    });
  }

  // 29. Test Psycho Needs Revision Notification
  async sendTestPsychoNeedsRevisionNotification(
    candidate: User,
    job: Job,
    company: MstCompany,
  ) {
    const payload = {
      notification: {
        title: "Test Revision Required",
        body: `Please revise your test submission for ${job.title}`,
        image: company.logo_url,
      },
      data: {
        entity: "job",
        id: job.id,
      },
    };

    await this.sendPushNotification(candidate.firebase_uid, payload, {
      job,
      company,
    });
  }
}

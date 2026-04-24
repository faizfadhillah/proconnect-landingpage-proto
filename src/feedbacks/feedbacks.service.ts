import {
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, Like } from "typeorm";
import { CreateFeedbackDto } from "./dto/create-feedback.dto";
import { UpdateFeedbackDto } from "./dto/update-feedback.dto";
import {
  Feedback,
  FeedbackStatus,
} from "src/feedbacks/entities/feedback.entity";
import { MailjetService } from "src/users/mailjet.service";
import { User } from "src/users/entities/user.entity";
import { ConfigsService } from "src/config/config.service";
import { EncryptedUserDataService } from "src/encrypted_user_data/encrypted_user_data.service";
import { LoggingService } from "src/logs/logs.service";

@Injectable()
export class FeedbacksService {
  constructor(
    @InjectRepository(Feedback)
    private feedbacksRepository: Repository<Feedback>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private readonly mailjetService: MailjetService,
    private readonly configsService: ConfigsService,
    private readonly encryptedUserDataService: EncryptedUserDataService,
    private readonly loggingService: LoggingService,
  ) { }

  async generateCode(): Promise<string> {
    const repository = this.feedbacksRepository;

    const now = new Date();
    const year = now.getFullYear().toString().slice(-2);
    const month = (now.getMonth() + 1).toString().padStart(2, "0");
    const likePattern = `${year}${month}%`;

    const lastNest = await repository.findOne({
      where: { code: Like(likePattern) },
      order: { code: "DESC" },
    });

    let sequence = 1;
    if (lastNest) {
      sequence = parseInt(lastNest.code.slice(4)) + 1;
    }

    return `${year}${month}${sequence.toString().padStart(4, "0")}`;
  }

  async create(createFeedbackDto: CreateFeedbackDto): Promise<Feedback> {
    const post = this.feedbacksRepository.create(createFeedbackDto);
    post.code = await this.generateCode();
    post.status = FeedbackStatus.OPEN;
    const saved = await this.feedbacksRepository.save(post);
    await this.sendFeedbackEmailToCs(saved);
    await this.sendFeedbackEmailToUser(saved);
    return saved;
  }

  async findAll(): Promise<Feedback[]> {
    return await this.feedbacksRepository.find();
  }

  async findOne(id: string): Promise<Feedback> {
    const post = await this.feedbacksRepository.findOne({ where: { id } });
    if (!post) {
      throw new NotFoundException(`Feedback with ID ${id} not found`);
    }
    return post;
  }

  async update(
    id: string,
    updateFeedbackDto: UpdateFeedbackDto,
  ): Promise<Feedback> {
    const post = await this.findOne(id);
    Object.assign(post, updateFeedbackDto);
    post.code = post.code || (await this.generateCode());
    return await this.feedbacksRepository.save(post);
  }

  async remove(id: string): Promise<void> {
    const result = await this.feedbacksRepository.softDelete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Feedback with ID ${id} not found`);
    }
  }

  /**
   * Resolve sender name & phone (prefer full decrypted phone, fallback to masked last 4 digits).
   */
  private async resolveSenderInfo(
    feedback: Feedback,
  ): Promise<{ name?: string; phone?: string; email?: string }> {
    let name: string | undefined;
    let phone: string | undefined;
    let email: string | undefined;

    if (!feedback.user_id) {
      return { name, phone, email };
    }

    const user = await this.userRepository.findOne({
      where: { id: feedback.user_id },
    });
    name = user?.full_name;
    email = user?.email;

    // Prefer full decrypted phone when available; fall back to masked last 4 digits
    try {
      const decrypted =
        await this.encryptedUserDataService.findOneDecrypted(feedback.user_id);
      if (decrypted && decrypted.encrypted_phone) {
        phone = decrypted.encrypted_phone;
      }
    } catch (err) {
      // If decryption fails, continue with masked phone / email only
      this.loggingService.error(
        `Failed to decrypt phone for feedback sender ${feedback.user_id}:`,
        err,
      );
    }

    if (!phone && user?.phone_last_4_digits) {
      phone = `****${user.phone_last_4_digits}`;
    }

    return { name, phone, email };
  }

  /**
   * Build absolute attachment URL using SELF_URL when attachment_url is relative.
   */
  private buildAttachmentUrl(rawUrl?: string | null): string | undefined {
    if (!rawUrl) return undefined;

    if (/^https?:\/\//i.test(rawUrl)) {
      // Already absolute
      return rawUrl;
    }

    const selfBase = (process.env.SELF_URL || "").trim();
    if (!selfBase) {
      // Fallback: keep as-is if base URL not configured
      return rawUrl;
    }

    const base = selfBase.endsWith("/") ? selfBase.slice(0, -1) : selfBase;
    const path = rawUrl.startsWith("/") ? rawUrl : `/${rawUrl}`;
    return `${base}${path}`;
  }

  /**
   * Construct payload & send feedback notification email to CS.
   * Errors are logged but do not fail the feedback creation.
   */
  private async sendFeedbackEmailToCs(saved: Feedback): Promise<void> {
    try {
      const { name, phone, email } = await this.resolveSenderInfo(saved);
      this.loggingService.info(`${JSON.stringify({
        name,
        phone,
        email,
      })}`);

      const csConfig = await this.configsService.getValueByKey<{ email: string }>(
        "feedback_cs_email",
        { email: "cs@proconnectcareer.com" },
      );
      const csEmail = csConfig?.email;

      await this.mailjetService.sendFeedbackToCs({
        csEmail,
        code: saved.code,
        type: saved.type,
        description: saved.description,
        senderEmail: email ?? saved.email ?? "",
        senderName: name ?? saved.email ?? "-",
        senderPhone: phone ?? "-",
        attachmentUrl: this.buildAttachmentUrl(saved.attachment_url),
      });

      this.loggingService.info(`Feedback email sent to CS, with id: ${saved.id} and code: ${saved.code} to email: ${csEmail}`);
    } catch (err) {
      // Log but do not fail the create request
      this.loggingService.error("Failed to send feedback email to CS:", err);
    }
  }

  /**
   * Send feedback confirmation email to user who submitted the feedback.
   * Errors are logged but do not fail the feedback creation.
   */
  private async sendFeedbackEmailToUser(saved: Feedback): Promise<void> {
    try {
      const { name, email } = await this.resolveSenderInfo(saved);

      // Only send email if we have a valid email address
      const userEmail = email ?? saved.email;
      if (!userEmail) {
        this.loggingService.info(`Skipping user feedback email - no email found for feedback ${saved.id}`);
        return;
      }

      await this.mailjetService.sendFeedbackToUser({
        userEmail,
        userName: name ?? saved.email ?? "-",
        code: saved.code,
        type: saved.type,
        description: saved.description,
        attachmentUrl: this.buildAttachmentUrl(saved.attachment_url),
      });

      this.loggingService.info(`Feedback confirmation email sent to user, with id: ${saved.id} and code: ${saved.code} to email: ${userEmail}`);
    } catch (err) {
      // Log but do not fail the create request
      this.loggingService.error("Failed to send feedback confirmation email to user:", err);
    }
  }
}

import { Injectable, Inject, forwardRef } from "@nestjs/common";
import * as admin from "firebase-admin";
import { FirebaseAdmin, InjectFirebaseAdmin } from "nestjs-firebase";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { User } from "../users/entities/user.entity";
import { UsersService } from "../users/users.service";
import { MailjetService } from "../users/mailjet.service";
import { LoggingService } from "src/logs/logs.service";

@Injectable()
export class FirebaseService {
  private messaging: admin.messaging.Messaging;
  private firestore: admin.firestore.Firestore;

  constructor(
    @InjectFirebaseAdmin()
    private readonly firebaseAdmin: FirebaseAdmin,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @Inject(forwardRef(() => UsersService))
    private readonly usersService: UsersService,
    @Inject(forwardRef(() => MailjetService))
    private readonly mailjetService: MailjetService,
    private readonly logger: LoggingService,
  ) {
    this.messaging = firebaseAdmin.messaging;
    this.firestore = firebaseAdmin.firestore;
  }

  async saveToken(uid: string, token: string): Promise<void> {
    const db = this.firestore;
    await db.collection("user_tokens").doc(uid).set({ token });
  }

  async sendPushNotification(
    uid: string,
    payload: admin.messaging.MessagingPayload,
    data?: any,
  ) {
    try {
      const result = {
        //token,
        title: payload.notification.title,
        image: payload.notification.image,
        body: payload.notification.body,
        uid: uid,
        sentAt: new Date().getTime(),
        dateAt: new Date().toISOString(),
        data: JSON.parse(JSON.stringify(data)),
      };
      await this.saveNotification(result);

      const objtoken = await this.firestore
        .collection("user_tokens")
        .doc(uid)
        .get();

      if (!objtoken.exists) {
        return;
      }

      const token = objtoken.get("token");

      if (!token) {
        return;
      }

      const message = {
        token,
        ...payload,
      };

      await this.messaging.send(message);
    } catch (error) {
      this.logger.error(
        `Error sending message: ${error instanceof Error ? error.message : String(error)}`,
        "firebase",
        error instanceof Error ? error.stack : undefined,
      );
    }
  }

  async saveNotification(notification: any) {
    try {
      const notificationsRef = this.firestore.collection("notifications");
      const res = await notificationsRef.add(notification);
      return res.id;
    } catch (error) {
      this.logger.error(
        `Error saving notification: ${error instanceof Error ? error.message : String(error)}`,
        "firebase",
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }

  async getNotifications(uid: string) {
    try {
      const notificationsRef = this.firestore.collection("notifications");
      const snapshot = await notificationsRef
        .where("uid", "==", uid)
        .orderBy("dateAt", "desc")
        .limit(100)
        .get();

      if (snapshot.empty) {
        return [];
      }

      const notifications = [];
      snapshot.forEach((doc) => {
        notifications.push({
          id: doc.id,
          ...doc.data(),
        });
      });

      return notifications;
    } catch (error) {
      this.logger.error(
        `Error getting notifications: ${error instanceof Error ? error.message : String(error)}`,
        "firebase",
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }

  async readNotification(notificationId: string) {
    try {
      const notificationsRef = this.firestore.collection("notifications");
      await notificationsRef.doc(notificationId).update({
        read: true,
        readAt: new Date().toISOString(),
      });
    } catch (error) {
      this.logger.error(
        `Error marking notification as read: ${error instanceof Error ? error.message : String(error)}`,
        "firebase",
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }

  /**
   * Mendapatkan list email yang terdaftar di Firebase Auth tetapi tidak ada di sistem
   * Ini berguna untuk mengidentifikasi akun yang "nyangkut" ketika login
   */
  async getOrphanEmails(maxResults: number = 1000): Promise<{
    orphanEmails: Array<{
      uid: string;
      email: string;
      emailVerified: boolean;
      creationTime: string;
      lastSignInTime: string | null;
      customClaims: any;
      disabled: boolean;
    }>;
    totalOrphans: number;
    totalFirebaseUsers: number;
    totalSystemUsers: number;
  }> {
    try {
      // Ambil semua user dari Firebase Auth
      const firebaseUsers: admin.auth.UserRecord[] = [];
      let nextPageToken: string | undefined;

      do {
        const listUsersResult = await this.firebaseAdmin.auth.listUsers(
          maxResults,
          nextPageToken,
        );
        firebaseUsers.push(...listUsersResult.users);
        nextPageToken = listUsersResult.pageToken;
      } while (nextPageToken && firebaseUsers.length < maxResults);

      this.logger.log(`Found ${firebaseUsers.length} users in Firebase Auth`, "firebase");

      // Ambil semua email dari sistem
      const systemUsers = await this.usersRepository.find({
        select: ["email", "firebase_uid"],
        where: { deleted_at: null },
      });

      const systemEmails = new Set(systemUsers.map((user) => user.email));
      const systemFirebaseUids = new Set(
        systemUsers.map((user) => user.firebase_uid),
      );

      this.logger.log(`Found ${systemUsers.length} users in system database`, "firebase");

      // Filter Firebase users yang tidak ada di sistem
      const orphanUsers = firebaseUsers.filter((firebaseUser) => {
        // Cek berdasarkan email dan firebase_uid
        const emailExists =
          firebaseUser.email && systemEmails.has(firebaseUser.email);
        const uidExists = systemFirebaseUids.has(firebaseUser.uid);

        return !emailExists && !uidExists;
      });

      // Format data orphan users
      const orphanEmails = orphanUsers.map((user) => ({
        uid: user.uid,
        email: user.email || "N/A",
        emailVerified: user.emailVerified,
        creationTime: user.metadata.creationTime,
        lastSignInTime: user.metadata.lastSignInTime || null,
        customClaims: user.customClaims || {},
        disabled: user.disabled,
      }));

      this.logger.log(`Found ${orphanEmails.length} orphan emails`, "firebase");

      return {
        orphanEmails,
        totalOrphans: orphanEmails.length,
        totalFirebaseUsers: firebaseUsers.length,
        totalSystemUsers: systemUsers.length,
      };
    } catch (error) {
      this.logger.error(
        `Error getting orphan emails: ${error instanceof Error ? error.message : String(error)}`,
        "firebase",
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }

  /**
   * Mendapatkan list users yang ada di database tetapi tidak ada di Firebase Auth
   * Ini berguna untuk mengidentifikasi akun yang ada di database tapi firebase_uid-nya tidak ada di Firebase
   */
  async getOrphanUsers(): Promise<{
    orphanUsers: Array<{
      id: string;
      email: string;
      full_name: string;
      firebase_uid: string;
      user_role: string;
      is_email_verified: boolean;
      created_at: Date;
      updated_at: Date;
    }>;
    totalOrphans: number;
    totalFirebaseUsers: number;
    totalSystemUsers: number;
  }> {
    try {
      // Ambil semua user dari database yang tidak dihapus
      const systemUsers = await this.usersRepository.find({
        where: { deleted_at: null },
        select: [
          "id",
          "email",
          "full_name",
          "firebase_uid",
          "user_role",
          "is_email_verified",
          "created_at",
          "updated_at",
        ],
      });

      this.logger.log(`Found ${systemUsers.length} users in system database`, "firebase");

      // Ambil semua Firebase UID dari Firebase Auth
      const firebaseUsers: admin.auth.UserRecord[] = [];
      let nextPageToken: string | undefined;

      do {
        const listUsersResult = await this.firebaseAdmin.auth.listUsers(
          1000,
          nextPageToken,
        );
        firebaseUsers.push(...listUsersResult.users);
        nextPageToken = listUsersResult.pageToken;
      } while (nextPageToken);

      const firebaseUids = new Set(firebaseUsers.map((user) => user.uid));
      this.logger.log(`Found ${firebaseUsers.length} users in Firebase Auth`, "firebase");

      // Filter users yang firebase_uid-nya tidak ada di Firebase
      const orphanUsers = systemUsers.filter((systemUser) => {
        // Skip jika firebase_uid kosong atau null
        if (!systemUser.firebase_uid) {
          return false;
        }
        // Check if firebase_uid contains "-deleted-" suffix (from soft delete)
        // These are not real orphan users, they're soft-deleted users
        if (systemUser.firebase_uid.includes("-deleted-")) {
          return false;
        }
        return !firebaseUids.has(systemUser.firebase_uid);
      });

      // Format data orphan users
      const formattedOrphanUsers = orphanUsers.map((user) => ({
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        firebase_uid: user.firebase_uid,
        user_role: user.user_role,
        is_email_verified: user.is_email_verified,
        created_at: user.created_at,
        updated_at: user.updated_at,
      }));

      this.logger.log(`Found ${formattedOrphanUsers.length} orphan users`, "firebase");

      return {
        orphanUsers: formattedOrphanUsers,
        totalOrphans: formattedOrphanUsers.length,
        totalFirebaseUsers: firebaseUsers.length,
        totalSystemUsers: systemUsers.length,
      };
    } catch (error) {
      this.logger.error(
        `Error getting orphan users: ${error instanceof Error ? error.message : String(error)}`,
        "firebase",
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }

  /**
   * Menghapus user dari Firebase Auth berdasarkan UID
   * Berguna untuk membersihkan akun orphan
   * Safety: Hanya menghapus jika user tidak terdaftar di database aplikasi
   */
  async deleteFirebaseUser(
    uid: string,
  ): Promise<{ success: boolean; message: string }> {
    try {
      // Safety check: Verifikasi bahwa user tidak terdaftar di database aplikasi
      const existingUser = await this.usersRepository.findOne({
        where: { firebase_uid: uid, deleted_at: null },
      });

      if (existingUser) {
        return {
          success: false,
          message: `Cannot delete Firebase user with UID ${uid}: User exists in application database (ID: ${existingUser.id}, Email: ${existingUser.email}). This is a safety measure to prevent accidental deletion of legitimate accounts.`,
        };
      }

      await this.firebaseAdmin.auth.deleteUser(uid);
      return {
        success: true,
        message: `User with UID ${uid} successfully deleted from Firebase Auth`,
      };
    } catch (error) {
      this.logger.error(
        `Error deleting Firebase user: ${error instanceof Error ? error.message : String(error)}`,
        "firebase",
        error instanceof Error ? error.stack : undefined,
      );
      return {
        success: false,
        message: `Failed to delete user with UID ${uid}: ${error.message}`,
      };
    }
  }

  /**
   * Menghapus multiple Firebase users sekaligus
   */
  async bulkDeleteFirebaseUsers(uids: string[]): Promise<{
    successCount: number;
    failureCount: number;
    errors: Array<{ uid: string; error: string }>;
  }> {
    const errors: Array<{ uid: string; error: string }> = [];
    let successCount = 0;
    let failureCount = 0;

    for (const uid of uids) {
      try {
        await this.firebaseAdmin.auth.deleteUser(uid);
        successCount++;
      } catch (error) {
        failureCount++;
        errors.push({
          uid,
          error: error.message,
        });
      }
    }

    return {
      successCount,
      failureCount,
      errors,
    };
  }

  /**
   * Generate random password for Firebase user
   */
  private generateRandomPassword(length: number = 12): string {
    const charset =
      "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
    let password = "";
    for (let i = 0; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    return password;
  }

  /**
   * Create Firebase user for database orphan user
   * Creates a new Firebase Auth user and updates the database user's firebase_uid
   */
  async createFirebaseUserForOrphanUser(userId: string): Promise<{
    success: boolean;
    message: string;
    firebase_uid?: string;
  }> {
    try {
      // Get user from database
      const user = await this.usersRepository.findOne({
        where: { id: userId, deleted_at: null },
      });

      if (!user) {
        return {
          success: false,
          message: `User with ID ${userId} not found`,
        };
      }

      if (!user.email) {
        return {
          success: false,
          message: `User with ID ${userId} has no email address`,
        };
      }

      // Check if email already exists in Firebase
      let firebaseUser;
      try {
        firebaseUser = await this.firebaseAdmin.auth.getUserByEmail(user.email);
        // If user exists, update database firebase_uid
        user.firebase_uid = firebaseUser.uid;
        await this.usersRepository.save(user);

        // Set custom claims
        await this.firebaseAdmin.auth.setCustomUserClaims(firebaseUser.uid, {
          user_token_id: user.id,
          roles: [user.user_role || "candidate"],
        });

        return {
          success: true,
          message: `Firebase user already exists for ${user.email}`,
          firebase_uid: firebaseUser.uid,
        };
      } catch (error) {
        // Email doesn't exist in Firebase, create new user
        if (error.code !== "auth/user-not-found") {
          throw error;
        }
      }

      // Create new Firebase user
      const password = this.generateRandomPassword(12);

      // Generate displayName from email if full_name is not available
      let displayName = user.full_name;
      if (!displayName || displayName.trim() === "") {
        // Extract name from email (part before @)
        const emailParts = user.email.split("@");
        displayName = emailParts[0] || user.email;
      }

      firebaseUser = await this.firebaseAdmin.auth.createUser({
        email: user.email,
        displayName: displayName,
        emailVerified: user.is_email_verified || false,
        password: password,
        disabled: false,
      });

      // Update database user's firebase_uid
      user.firebase_uid = firebaseUser.uid;
      await this.usersRepository.save(user);

      // Set custom claims
      await this.firebaseAdmin.auth.setCustomUserClaims(firebaseUser.uid, {
        user_token_id: user.id,
        roles: [user.user_role || "candidate"],
      });

      // Send forgot password email to the user
      try {
        const resetPasswordLink = await this.usersService.getResetPasswordLink(
          user.email,
          firebaseUser.uid,
        );
        await this.mailjetService.sendPasswordResetEmail(
          user,
          resetPasswordLink,
        );
        this.logger.log(`Forgot password email sent successfully to ${user.email}`, "firebase");
      } catch (emailError) {
        this.logger.error(
          `Failed to send forgot password email to ${user.email}: ${emailError instanceof Error ? emailError.message : String(emailError)}`,
          "firebase",
          emailError instanceof Error ? emailError.stack : undefined,
        );
        // Don't fail the entire operation if email fails
      }

      return {
        success: true,
        message: `Firebase user successfully created for ${user.email}`,
        firebase_uid: firebaseUser.uid,
      };
    } catch (error) {
      this.logger.error(
        `Error creating Firebase user for orphan user: ${error instanceof Error ? error.message : String(error)}`,
        "firebase",
        error instanceof Error ? error.stack : undefined,
      );
      return {
        success: false,
        message: `Failed to create Firebase user: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }

  /**
   * Bulk create Firebase users for database orphan users
   */
  async bulkCreateFirebaseUsersForOrphanUsers(userIds: string[]): Promise<{
    successCount: number;
    failureCount: number;
    errors: Array<{ userId: string; error: string }>;
  }> {
    const errors: Array<{ userId: string; error: string }> = [];
    let successCount = 0;
    let failureCount = 0;

    for (const userId of userIds) {
      try {
        const result = await this.createFirebaseUserForOrphanUser(userId);
        if (result.success) {
          successCount++;
        } else {
          failureCount++;
          errors.push({
            userId,
            error: result.message,
          });
        }
      } catch (error) {
        failureCount++;
        errors.push({
          userId,
          error: error.message,
        });
      }
    }

    return {
      successCount,
      failureCount,
      errors,
    };
  }
}

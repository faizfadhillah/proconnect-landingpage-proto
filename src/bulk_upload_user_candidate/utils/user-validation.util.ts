import { UsersDao } from "../../users/users.dao";

/**
 * Utility class for user validation operations
 */
export class UserValidationUtil {
  constructor(private readonly usersDao: UsersDao) {}

  /**
   * Check for existing emails in database
   */
  async checkExistingEmails(emails: string[]): Promise<Set<string>> {
    const existingUsers = await this.usersDao.findByEmails(emails);
    
    const existingEmails = new Set<string>();
    existingUsers.forEach(user => existingEmails.add(user.email));
    return existingEmails;
  }
}
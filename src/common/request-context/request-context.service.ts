import { Injectable } from '@nestjs/common';
import { ClsService } from 'nestjs-cls';

@Injectable()
export class RequestContextService {
  constructor(private readonly clsService: ClsService) {}

  /**
   * Check if CLS context exists
   */
  hasContext(): boolean {
    return this.clsService.has('requestId') || this.clsService.has('userId');
  }

  // Request ID methods
  getRequestId(): string | null {
    return this.clsService.get('requestId') || null;
  }

  setRequestId(requestId: string): void {
    this.clsService.set('requestId', requestId);
  }

  // User ID methods
  getCurrentUserId(): string | null {
    return this.clsService.get('userId') || null;
  }

  setCurrentUserId(userId: string): void {
    this.clsService.set('userId', userId);
  }

  // User role methods
  getCurrentUserIsCandidate(): boolean {
    return this.clsService.get('userIsCandidate') || false;
  }

  setCurrentUserIsCandidate(isCandidate: boolean): void {
    this.clsService.set('userIsCandidate', isCandidate);
  }

  getCurrentUserIsSysAdmin(): boolean {
    return this.clsService.get('userIsSysAdmin') || false;
  }

  setCurrentUserIsSysAdmin(isSysAdmin: boolean): void {
    this.clsService.set('userIsSysAdmin', isSysAdmin);
  }

  getCurrentUserIsEmployer(): boolean {
    return this.clsService.get('userIsEmployer') || false;
  }

  setCurrentUserIsEmployer(isEmployer: boolean): void {
    this.clsService.set('userIsEmployer', isEmployer);
  }
}

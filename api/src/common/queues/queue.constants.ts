/**
 * Centralized Queue Constants
 * 
 * Single source of truth for all queue names.
 * CRITICAL: NO plain strings - all @InjectQueue() must use constants for traceability.
 */

// Individual constants for @InjectQueue() decorator
// CRITICAL: NO plain strings - all injects must use constants

export const EDUCATION_VERIFICATION_QUEUE = 'education-verification';
export const CERTIFICATE_VERIFICATION_QUEUE = 'certificate-verification';
export const INFORMAL_CERTIFICATE_PROCESSING_QUEUE = 'informal-certificate-processing';
export const INFORMAL_CERTIFICATE_USER_PROCESSING_QUEUE = 'informal-certificate-user-processing';
export const RETROACTIVE_EDUCATION_LICENSE_QUEUE = 'retroactive-education-license';
export const RETROACTIVE_LICENSE_SKILL_QUEUE = 'retroactive-license-skill';

// Existing EMAIL queue (migrated from notifications)
// Note: Value matches EMAIL_QUEUE_NAMES.SEND_EMAIL for backward compatibility
export const SEND_EMAIL_QUEUE = 'send-email';

// Grouped constants (for backward compatibility and organization)
export const QUEUE_NAMES = {
  EMAIL: {
    SEND_EMAIL: SEND_EMAIL_QUEUE,
  },
  SKILL_MATCH: {
    EDUCATION_VERIFICATION: EDUCATION_VERIFICATION_QUEUE,
    CERTIFICATE_VERIFICATION: CERTIFICATE_VERIFICATION_QUEUE,
    INFORMAL_CERTIFICATE_PROCESSING: INFORMAL_CERTIFICATE_PROCESSING_QUEUE,
    INFORMAL_CERTIFICATE_USER_PROCESSING: INFORMAL_CERTIFICATE_USER_PROCESSING_QUEUE,
    RETROACTIVE_EDUCATION_LICENSE: RETROACTIVE_EDUCATION_LICENSE_QUEUE,
    RETROACTIVE_LICENSE_SKILL: RETROACTIVE_LICENSE_SKILL_QUEUE,
  },
};


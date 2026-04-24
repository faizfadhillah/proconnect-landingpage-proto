import { registerDecorator, ValidationOptions, ValidationArguments } from 'class-validator';
import { UserRoleAssignmentStatus, UserRoleAssignmentRole } from '../enums/user_role_assignment.enums';

/**
 * Custom validator to check if start_date is not in the future
 */
export function IsNotFutureDate(validationOptions?: ValidationOptions) {
  return function (object: any, propertyName: string) {
    registerDecorator({
      name: 'isNotFutureDate',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, _: ValidationArguments) {
          if (!value) return true; // Allow null/undefined
          const date = new Date(value);
          const now = new Date();
          now.setHours(23, 59, 59, 999); // End of today
          return date <= now;
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} cannot be in the future`;
        },
      },
    });
  };
}

/**
 * Custom validator to check if end_date is valid (can be null or future)
 */
export function IsValidEndDate(validationOptions?: ValidationOptions) {
  return function (object: any, propertyName: string) {
    registerDecorator({
      name: 'isValidEndDate',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, _args: ValidationArguments) {
          // Allow null/undefined (permanent employment)
          if (!value) return true;

          // Must be a valid date
          const date = new Date(value);

          // end date must in the past
          const now = new Date();
          now.setHours(23, 59, 59, 999); // End of today
          return date <= now;
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} must be a valid date in the past`;
        },
      },
    });
  };
}

/**
 * Custom validator to check if start_date <= end_date
 */
export function IsDateRangeValid(validationOptions?: ValidationOptions) {
  return function (object: any, propertyName: string) {
    registerDecorator({
      name: 'isDateRangeValid',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          const obj = args.object as any;
          const startDate = obj.startDate ? new Date(obj.startDate) : null;
          const endDate = value ? new Date(value) : null;
          
          // If start_date is null, it's valid (no date range to validate)
          if (!startDate) return true;
          
          // If end_date is null, it's valid
          if (!endDate) return true;

          // end date must in the past
          const now = new Date();
          if (endDate > now) return false;

          // start_date must be <= end_date
          return startDate <= endDate;
        },
        defaultMessage(_args: ValidationArguments) {
          return `End date must be greater than or equal to start date`;
        },
      },
    });
  };
}

/**
 * Custom validator to check role consistency for EMPLOYER role
 */
export function IsRoleConsistent(validationOptions?: ValidationOptions) {
  return function (object: any, propertyName: string) {
    registerDecorator({
      name: 'isRoleConsistent',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(_value: any, args: ValidationArguments) {
          const obj = args.object as any;
          const errors: string[] = [];

          if (obj.role === UserRoleAssignmentRole.EMPLOYER) {
            // EMPLOYER role requires company fields
            if (!obj.company_hq_id) {
              errors.push('EMPLOYER role requires companyHqId');
            }
            if (!obj.company_id) {
              errors.push('EMPLOYER role requires companyId');
            }
            if (!obj.company_role) {
              errors.push('EMPLOYER role requires companyRole');
            }
            // EMPLOYER cannot have school_id
            if (obj.school_id) {
              errors.push('EMPLOYER role cannot have school_id');
            }
          } else if (obj.role === UserRoleAssignmentRole.PIC_SCHOOL) {
            // PIC_SCHOOL role requires school_id
            if (!obj.school_id) {
              errors.push('PIC_SCHOOL role requires school_id');
            }
            // PIC_SCHOOL cannot have company fields
            if (obj.company_hq_id) {
              errors.push('PIC_SCHOOL role cannot have companyHqId');
            }
            if (obj.company_id) {
              errors.push('PIC_SCHOOL role cannot have companyId');
            }
            if (obj.company_role) {
              errors.push('PIC_SCHOOL role cannot have companyRole');
            }
            if (obj.dept_id) {
              errors.push('PIC_SCHOOL role cannot have deptId');
            }
          } else {
            // Non-EMPLOYER and non-PIC_SCHOOL roles must have null company fields and school_id
            if (obj.company_hq_id) {
              errors.push(`${obj.role} role cannot have companyHqId`);
            }
            if (obj.company_id) {
              errors.push(`${obj.role} role cannot have companyId`);
            }
            if (obj.company_role) {
              errors.push(`${obj.role} role cannot have companyRole`);
            }
            if (obj.dept_id) {
              errors.push(`${obj.role} role cannot have deptId`);
            }
            if (obj.school_id) {
              errors.push(`${obj.role} role cannot have school_id`);
            }
          }

          // Store errors for message generation
          (args.object as any).__roleErrors = errors;
          return errors.length === 0;
        },
        defaultMessage(args: ValidationArguments) {
          const obj = args.object as any;
          const errors = obj.__roleErrors || [];
          return errors.join(', ');
        },
      },
    });
  };
}

/**
 * Custom validator to check status consistency with dates
 */
export function IsStatusWithinDateRange(validationOptions?: ValidationOptions) {
  return function (object: any, propertyName: string) {
    registerDecorator({
      name: 'isStatusWithinDateRange',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          const obj = args.object as any;
          const status = value as UserRoleAssignmentStatus;
          const now = new Date();
          
          if (status === UserRoleAssignmentStatus.INACTIVE) {
            const endDate = obj.endDate ? new Date(obj.endDate) : null;
            
            // If INACTIVE, either:
            // 1. end_date has passed, OR
            // 2. end_date is null (meaning terminated)
            if (endDate) {
              return endDate < now; // end_date must have passed
            }

            // If end_date is null, INACTIVE is allowed
            return true;
          }

          if (status === UserRoleAssignmentStatus.ACTIVE) {
            // active status cannot have end date
            const endDate = obj.endDate ? new Date(obj.endDate) : null;
            if (endDate) {
              return false;
            }
          }
          
          return true; // default is valid
        },
        defaultMessage(_args: ValidationArguments) {
          return 'INACTIVE status is only allowed if end_date has passed or is null, ACTIVE status cannot have end_date';
        },
      },
    });
  };
}

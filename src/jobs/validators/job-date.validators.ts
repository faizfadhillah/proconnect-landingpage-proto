import {
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
  Validate,
} from "class-validator";
import { tomorrowStartGMT7 } from "src/utils/date.util";

/**
 * Validates that close_date (when present) is at least D+1 (not today) in GMT+7.
 * Date is expected to be normalized to 00:00 GMT+7.
 */
@ValidatorConstraint({ name: "CloseDateInFuture", async: false })
export class CloseDateInFutureConstraint implements ValidatorConstraintInterface {
  validate(value: unknown): boolean {
    if (value == null) return true;
    if (!(value instanceof Date)) return false;
    return value.getTime() >= tomorrowStartGMT7().getTime();
  }

  defaultMessage(_args?: ValidationArguments): string {
    return "close_date must be at least D+1 (not today), 00:00 GMT+7";
  }
}

/**
 * Validates that when both open_date and close_date are set, close_date is after open_date.
 * Applied on close_date property; reads both from args.object.
 */
@ValidatorConstraint({ name: "CloseDateAfterOpenDate", async: false })
export class CloseDateAfterOpenDateConstraint implements ValidatorConstraintInterface {
  validate(_value: unknown, args: ValidationArguments): boolean {
    const dto = args.object as { open_date?: Date | null; close_date?: Date | null };
    const open = dto.open_date;
    const close = dto.close_date;
    if (open == null || close == null) return true;
    return close > open;
  }

  defaultMessage(_args?: ValidationArguments): string {
    return "close_date must be after open_date";
  }
}

export function CloseDateInFuture(): PropertyDecorator {
  return (target: object, propertyKey: string | symbol) => {
    Validate(CloseDateInFutureConstraint)(target, propertyKey as string);
  };
}

export function CloseDateAfterOpenDate(): PropertyDecorator {
  return (target: object, propertyKey: string | symbol) => {
    Validate(CloseDateAfterOpenDateConstraint)(target, propertyKey as string);
  };
}

import { ValidatorConstraint, ValidatorConstraintInterface, ValidationArguments, Validate } from "class-validator";

@ValidatorConstraint({ name: "UniqueAssignmentCombination", async: false })
export class UniqueAssignmentCombinationConstraint implements ValidatorConstraintInterface {
    validate(assignments: any[], _args: ValidationArguments): boolean {
        if (!Array.isArray(assignments)) return true;
        const seen = new Set<string>();
        for (const a of assignments) {
            const userId = a?.user_id ?? "";
            const hqId = a?.company_hq_id ?? "";
            const companyId = a?.company_id ?? "";
            const deptKey = a?.dept_id === null ? "NULL" : (a?.dept_id ?? "");
            const key = `${userId}|${hqId}|${companyId}|${deptKey}`;
            if (seen.has(key)) return false;
            seen.add(key);
        }
        return true;
    }

    defaultMessage(_args?: ValidationArguments): string {
        return "Duplicate assignment combination of user_id, company_hq_id, company_id, dept_id in payload";
    }
}

export function UniqueAssignmentCombination(): PropertyDecorator {
    return (target: object, propertyKey: string | symbol) => {
        Validate(UniqueAssignmentCombinationConstraint)(target, propertyKey as string);
    };
}



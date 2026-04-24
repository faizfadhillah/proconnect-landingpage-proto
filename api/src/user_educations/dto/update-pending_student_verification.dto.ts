import { PartialType } from "@nestjs/swagger";
import { CreatePendingStudentVerificationDto } from "./create-pending_student_verification.dto";

export class UpdatePendingStudentVerificationDto extends PartialType(CreatePendingStudentVerificationDto) { }

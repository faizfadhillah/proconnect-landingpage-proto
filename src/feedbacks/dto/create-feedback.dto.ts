import { IsUUID, IsString, IsEnum, Length, IsOptional } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";
import { FeedbackStatus, FeedbackType } from "../entities/feedback.entity";

export class CreateFeedbackDto {
  @ApiProperty({
    type: String,
    description: "The id of the user who created the post",
    example: "12345678-1234-1234-1234-1234567890ab",
  })
  @IsUUID()
  @IsOptional()
  user_id: string;

  @ApiProperty({
    type: String,
    description: "The type of feedbacks",
    enum: FeedbackType,
    example: FeedbackType.GENERAL,
  })
  @IsEnum(FeedbackType)
  type: FeedbackType;

  @ApiProperty({
    type: String,
    description: "The email of public feedbacks",
    example: "public@mail.com",
  })
  @IsString()
  @IsOptional()
  email: string;

  @ApiProperty({
    type: String,
    description: "The description of feedbacks",
    example: "lorem ipsum add data case on registration, how to solved it ?",
  })
  @IsString()
  @Length(7, 3000)
  description: string;

  @ApiProperty({
    type: String,
    description: "The url of attachment's feedback",
    example: "ffff/image.jpg",
  })
  @IsString()
  @IsOptional()
  attachment_url: string;

  @ApiProperty({
    type: String,
    description: "The status of feedbacks",
    enum: FeedbackStatus,
    example: FeedbackStatus.OPEN,
  })
  @IsOptional()
  @IsEnum(FeedbackStatus)
  status: FeedbackStatus;
}

import { IsUUID, IsString, IsEnum, Length } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";
import { PostType } from "../entities/post.entity";

export class CreatePostDto {
  @ApiProperty({
    type: String,
    description: "The id of the user who created the post",
    example: "12345678-1234-1234-1234-1234567890ab",
  })
  @IsUUID()
  user_id: string;

  @ApiProperty({
    type: String,
    description: "The id of the company",
    example: "12345678-1234-1234-1234-1234567890ab",
  })
  @IsUUID()
  company_id: string;

  @ApiProperty({
    type: String,
    description: "The content of the post",
    example: "This is a post content",
  })
  @IsString()
  content: string;

  @ApiProperty({
    type: String,
    description: "The type of the post",
    enum: PostType,
    example: PostType.PUBLIC,
  })
  @IsEnum(PostType)
  post_type: PostType;

  @ApiProperty({
    type: String,
    description: "The tags of the post",
    example: "Technology",
  })
  @IsString()
  @Length(3, 255)
  tags: string;
}

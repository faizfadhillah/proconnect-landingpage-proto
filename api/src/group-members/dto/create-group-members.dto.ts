import { IsString, IsUUID, IsDateString, Length } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class CreateGroupMembersDto {
  @ApiProperty({
    type: String,
    description: "The ID of the group",
    example: "d290f1ee-6c54-4b01-90e6-d701748f0851",
  })
  @IsUUID()
  group_id: string;

  @ApiProperty({
    type: String,
    description: "The ID of the user",
    example: "550e8400-e29b-41d4-a716-446655440000",
  })
  @IsUUID()
  user_id: string;

  @ApiProperty({
    type: String,
    description: "The role of the user in the group",
    example: "admin",
  })
  @IsString()
  @Length(3, 50)
  role: string;

  @ApiProperty({
    type: String,
    description: "The date the user joined the group",
    example: "2024-10-11T00:00:00.000Z",
  })
  @IsDateString()
  joined_at: Date;
}

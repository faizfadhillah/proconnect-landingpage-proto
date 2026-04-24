import { IsString, IsOptional, Length } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class CreateGroupsDto {
  @ApiProperty({
    type: String,
    description: "The name of the group",
    example: "Developers Group",
  })
  @IsString()
  @Length(3, 255)
  name: string;

  @ApiProperty({
    type: String,
    description: "The description of the group",
    example: "A group for all developers to share knowledge and collaborate.",
  })
  @IsOptional()
  @IsString()
  description?: string;
}

import { IsString, IsDate, Length } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";

export class CreateEventDto {
  @ApiProperty({
    type: String,
    description: "The title of the event",
    example: "Annual Meeting",
  })
  @IsString()
  @Length(3, 255)
  title: string;

  @ApiProperty({
    type: String,
    description: "The description of the event",
    example: "This is the annual meeting of the company.",
  })
  @IsString()
  description: string;

  @ApiProperty({
    type: Date,
    description: "The date of the event",
    example: "2023-12-25T10:00:00Z",
  })
  @IsDate()
  @Type(() => Date)
  event_date: Date;

  @ApiProperty({
    type: String,
    description: "The tags of the event",
    example: "technology",
  })
  @IsString()
  @Length(3, 255)
  tags: string;
}

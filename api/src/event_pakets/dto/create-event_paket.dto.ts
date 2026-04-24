import {
  IsUUID,
  IsString,
  IsBoolean,
  IsNumber,
  Length,
} from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class CreateEventPaketDto {
  @ApiProperty({
    type: String,
    description: "The ID of the event",
    example: "12345678-1234-1234-1234-1234567890ab",
  })
  @IsUUID()
  event_id: string;

  @ApiProperty({
    type: String,
    description: "The name of the event paket",
    example: "Premium Package",
  })
  @IsString()
  @Length(3, 255)
  name: string;

  @ApiProperty({
    type: String,
    description: "The description of the event paket",
    example: "This is a premium package offering exclusive benefits.",
  })
  @IsString()
  description: string;

  @ApiProperty({
    type: Number,
    description: "The price of the event paket",
    example: 99.99,
  })
  @IsNumber()
  price: number;

  @ApiProperty({
    type: Boolean,
    description: "Indicates if the paket is premium",
    example: true,
  })
  @IsBoolean()
  is_premium: boolean;
}

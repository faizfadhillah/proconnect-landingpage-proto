import { IsString, IsNumber, Length } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class CreateMstSubscriptionDto {
  @ApiProperty({
    type: String,
    description: "The name of the subscription",
    example: "Premium Plan",
  })
  @IsString()
  @Length(3, 255)
  name: string;

  @ApiProperty({
    type: String,
    description: "The description of the subscription",
    example: "Access to all premium features",
  })
  @IsString()
  description: string;

  @ApiProperty({
    type: String,
    description: "The price of the subscription",
    example: "19.99",
  })
  @IsNumber()
  price: number;

  @ApiProperty({
    type: Number,
    description: "The duration of the subscription in days",
    example: 30,
  })
  @IsNumber()
  duration: number;
}

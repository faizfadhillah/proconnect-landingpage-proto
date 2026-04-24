import { IsUUID, IsString, IsEnum, IsNumber, Length } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";
import { InvoiceStatus } from "../entities/invoice.entity";

export class CreateInvoiceDto {
  @ApiProperty({
    type: String,
    description: "The ID of the user associated with the invoice",
    example: "12345678-1234-1234-1234-1234567890ab",
  })
  @IsUUID()
  userId: string;

  @ApiProperty({
    type: String,
    description: "The invoice number",
    example: "INV-12345",
  })
  @IsString()
  @Length(1, 50)
  invoiceNumber: string;

  @ApiProperty({
    type: String,
    description: "The payment method used",
    example: "Credit Card",
  })
  @IsString()
  @Length(1, 50)
  paymentMethod: string;

  @ApiProperty({
    type: Number,
    description: "The amount of the invoice",
    example: 100.5,
  })
  @IsNumber()
  amount: number;

  @ApiProperty({
    type: String,
    description: "The status of the invoice (paid, pending, overdue)",
    enum: InvoiceStatus,
    example: InvoiceStatus.PAID,
  })
  @IsEnum(InvoiceStatus)
  status: InvoiceStatus;

  @ApiProperty({
    type: String,
    description: "The subscription ID associated with the invoice",
    example: "12345678-1234-1234-1234-1234567890ab",
  })
  @IsUUID()
  subscriptionId: string;
}

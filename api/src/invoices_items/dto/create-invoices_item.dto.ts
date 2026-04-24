import { IsUUID, IsNumber, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { InvoiceItemStatus } from '../entities/invoices_item.entity';

export class CreateInvoicesItemDto {
  @ApiProperty({
    type: String,
    description: 'The ID of the invoice',
    example: '12345678-1234-1234-1234-1234567890ab',
  })
  @IsUUID()
  invoice_id: string;

  @ApiProperty({
    type: String,
    description: 'The ID of the paket',
    example: '87654321-4321-4321-4321-9876543210ab',
  })
  @IsUUID()
  paket_id: string;

  @ApiProperty({
    type: Number,
    description: 'The price of the item',
    example: 100.50,
  })
  @IsNumber()
  price: number;

  @ApiProperty({
    type: Number,
    description: 'The quantity of the item',
    example: 2,
  })
  @IsNumber()
  qty: number;

  @ApiProperty({
    type: Number,
    description: 'The total amount',
    example: 201.00,
  })
  @IsNumber()
  amount: number;

  @ApiProperty({
    type: String,
    description: 'The status of the item',
    enum: InvoiceItemStatus,
    example: InvoiceItemStatus.PAID,
  })
  @IsEnum(InvoiceItemStatus)
  status: InvoiceItemStatus;
}
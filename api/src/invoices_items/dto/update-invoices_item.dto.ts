import { PartialType } from '@nestjs/mapped-types';
import { CreateInvoicesItemDto } from './create-invoices_item.dto';
import { IsEnum, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { InvoiceItemStatus } from '../entities/invoices_item.entity';

export class UpdateInvoicesItemDto extends PartialType(CreateInvoicesItemDto) {  
  @ApiProperty({
    type: Number,
    description: 'The price of the item',
    example: 100.50,
  })
  @IsNumber()
  price?: number;

  @ApiProperty({
    type: Number,
    description: 'The quantity of the item',
    example: 2,
  })
  @IsNumber()
  qty?: number;

  @ApiProperty({
    type: Number,
    description: 'The total amount',
    example: 201.00,
  })
  @IsNumber()
  amount?: number;

  @ApiProperty({
    type: String,
    description: 'The status of the item',
    enum: InvoiceItemStatus,
    example: InvoiceItemStatus.PAID,
  })
  @IsEnum(InvoiceItemStatus)
  status?: InvoiceItemStatus;
}
import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { CreateInvoicesItemDto } from "./dto/create-invoices_item.dto";
import { UpdateInvoicesItemDto } from "./dto/update-invoices_item.dto";
import { InvoicesItem } from "./entities/invoices_item.entity";

@Injectable()
export class InvoicesItemsService {
  constructor(
    @InjectRepository(InvoicesItem)
    private invoicesItemRepository: Repository<InvoicesItem>,
  ) {}

  async create(
    createInvoicesItemDto: CreateInvoicesItemDto,
  ): Promise<InvoicesItem> {
    const invoicesItem = this.invoicesItemRepository.create(
      createInvoicesItemDto,
    );
    return await this.invoicesItemRepository.save(invoicesItem);
  }

  async findAll(): Promise<InvoicesItem[]> {
    return await this.invoicesItemRepository.find();
  }

  async findOne(invoice_id: string): Promise<InvoicesItem> {
    const invoicesItem = await this.invoicesItemRepository.findOne({
      where: { invoice_id },
    });
    if (!invoicesItem) {
      throw new NotFoundException(
        `InvoicesItem with ID ${invoice_id} not found`,
      );
    }
    return invoicesItem;
  }

  async update(
    invoice_id: string,
    updateInvoicesItemDto: UpdateInvoicesItemDto,
  ): Promise<InvoicesItem> {
    const invoicesItem = await this.findOne(invoice_id);
    Object.assign(invoicesItem, updateInvoicesItemDto);
    return await this.invoicesItemRepository.save(invoicesItem);
  }

  async remove(invoice_id: string): Promise<void> {
    const result = await this.invoicesItemRepository.softDelete(invoice_id);
    if (result.affected === 0) {
      throw new NotFoundException(
        `InvoicesItem with ID ${invoice_id} not found`,
      );
    }
  }
}

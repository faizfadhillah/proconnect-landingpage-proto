import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { CreateMstSubscriptionDto } from "./dto/create-mst_subscription.dto";
import { UpdateMstSubscriptionDto } from "./dto/update-mst_subscription.dto";
import { MstSubscription } from "./entities/mst_subscription.entity";

@Injectable()
export class MstSubscriptionService {
  constructor(
    @InjectRepository(MstSubscription)
    private mstSubscriptionRepository: Repository<MstSubscription>,
  ) {}

  async create(
    createMstSubscriptionDto: CreateMstSubscriptionDto,
  ): Promise<MstSubscription> {
    const subscription = this.mstSubscriptionRepository.create(
      createMstSubscriptionDto,
    );
    return await this.mstSubscriptionRepository.save(subscription);
  }

  async findAll(): Promise<MstSubscription[]> {
    return await this.mstSubscriptionRepository.find();
  }

  async findOne(id: string): Promise<MstSubscription> {
    const subscription = await this.mstSubscriptionRepository.findOne({
      where: { id },
    });
    if (!subscription) {
      throw new NotFoundException(`Subscription with ID ${id} not found`);
    }
    return subscription;
  }

  async update(
    id: string,
    updateMstSubscriptionDto: UpdateMstSubscriptionDto,
  ): Promise<MstSubscription> {
    const subscription = await this.findOne(id);
    Object.assign(subscription, updateMstSubscriptionDto);
    return await this.mstSubscriptionRepository.save(subscription);
  }

  async remove(id: string): Promise<void> {
    const result = await this.mstSubscriptionRepository.softDelete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Subscription with ID ${id} not found`);
    }
  }
}

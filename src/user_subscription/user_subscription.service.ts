import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { CreateUserSubscriptionDto } from "./dto/create-user_subscription.dto";
import { UpdateUserSubscriptionDto } from "./dto/update-user_subscription.dto";
import { UserSubscription } from "./entities/user_subscription.entity";

@Injectable()
export class UserSubscriptionService {
  constructor(
    @InjectRepository(UserSubscription)
    private userSubscriptionRepository: Repository<UserSubscription>,
  ) {}

  async create(
    createUserSubscriptionDto: CreateUserSubscriptionDto,
  ): Promise<UserSubscription> {
    const userSubscription = this.userSubscriptionRepository.create(
      createUserSubscriptionDto,
    );
    return await this.userSubscriptionRepository.save(userSubscription);
  }

  async findAll(): Promise<UserSubscription[]> {
    return await this.userSubscriptionRepository.find();
  }

  async findOne(id: string): Promise<UserSubscription> {
    const userSubscription = await this.userSubscriptionRepository.findOne({
      where: { id },
    });
    if (!userSubscription) {
      throw new NotFoundException(`UserSubscription with ID ${id} not found`);
    }
    return userSubscription;
  }

  async update(
    id: string,
    updateUserSubscriptionDto: UpdateUserSubscriptionDto,
  ): Promise<UserSubscription> {
    const userSubscription = await this.findOne(id);
    Object.assign(userSubscription, updateUserSubscriptionDto);
    return await this.userSubscriptionRepository.save(userSubscription);
  }

  async remove(id: string): Promise<void> {
    const result = await this.userSubscriptionRepository.softDelete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`UserSubscription with ID ${id} not found`);
    }
  }
}

import { PartialType } from '@nestjs/mapped-types';
import { CreateMstSubscriptionDto } from './create-mst_subscription.dto';

export class UpdateMstSubscriptionDto extends PartialType(CreateMstSubscriptionDto) {}
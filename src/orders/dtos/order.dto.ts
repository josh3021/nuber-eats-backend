import { ArgsType, Field, ID, ObjectType } from '@nestjs/graphql';
import { CoreOutput } from 'src/common/dtos/output.dto';
import { Order } from '../entities/order.entity';

@ArgsType()
export class OrderInput {
  @Field(() => ID)
  orderId: number;
}

@ObjectType()
export class OrderOutput extends CoreOutput {
  @Field(() => Order, { nullable: true })
  order?: Order;
}

export enum OrderStatus {
  Pending = 'Pending',
  Cooking = 'Cooking',
  Cooked = 'Cooked',
  PickedUp = 'PickedUp',
  Delivered = 'Delivered',
}

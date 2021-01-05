import {
  Field,
  InputType,
  ObjectType,
  registerEnumType,
} from '@nestjs/graphql';
import { IsEnum, IsNumber } from 'class-validator';
import {
  Column,
  Entity,
  JoinTable,
  ManyToMany,
  ManyToOne,
  RelationId,
} from 'typeorm';
import { CoreEntity } from '../../common/entities/core.entity';
import { Restaurant } from '../../restaurants/entities/restaurant.entity';
import { User } from '../../users/entities/user.entity';
import { OrderStatus } from '../dtos/order.dto';
import { OrderItem } from './order-item.entity';

registerEnumType(OrderStatus, { name: 'OrderStatus' });

@InputType('OrderInputType', { isAbstract: true })
@ObjectType()
@Entity()
export class Order extends CoreEntity {
  @ManyToOne(
    () => User,
    (user) => user.orders,
    { onDelete: 'SET NULL', nullable: true, eager: true },
  )
  @Field(() => User, { nullable: true })
  customer?: User;

  @ManyToOne(
    () => User,
    (user) => user.rides,
    { onDelete: 'SET NULL', nullable: true, eager: true },
  )
  @Field(() => User, { nullable: true })
  driver?: User;

  @ManyToOne(
    () => Restaurant,
    (restaurant) => restaurant.orders,
    { onDelete: 'SET NULL', nullable: true, eager: true },
  )
  @Field(() => Restaurant, { nullable: true })
  restaurant?: Restaurant;

  @ManyToMany(() => OrderItem, { eager: true })
  @JoinTable()
  @Field(() => [OrderItem])
  items: OrderItem[];

  @Column({ nullable: true })
  @Field(() => Number, { nullable: true })
  @IsNumber()
  total?: number;

  @Column({ type: 'enum', enum: OrderStatus, default: OrderStatus.Pending })
  @Field(() => OrderStatus)
  @IsEnum(OrderStatus)
  status: OrderStatus;

  @RelationId((order: Order) => order.customer)
  customerId: number;

  @RelationId((order: Order) => order.driver)
  driverId: number;
}

import { Field, InputType, Int, ObjectType } from '@nestjs/graphql';
import { IsInt } from 'class-validator';
import { Column, Entity, ManyToOne } from 'typeorm';
import { CoreEntity } from '../../common/entities/core.entity';
import { Dish, DishOption } from '../../restaurants/entities/dish.entity';

@InputType('OrderItemOptionInputType', { isAbstract: true })
@ObjectType()
@Entity()
export class OrderItemOption extends CoreEntity {
  @Field(() => String)
  name: string;

  @Field(() => String, { nullable: true })
  choice?: string;

  @Field(() => Int, { nullable: true })
  @IsInt()
  extra?: number;
}

@InputType('OrderItemInputType', { isAbstract: true })
@ObjectType()
@Entity()
export class OrderItem extends CoreEntity {
  @ManyToOne(() => Dish, { nullable: true, onDelete: 'CASCADE' })
  @Field(() => Dish)
  dish?: Dish;

  @Column({ type: 'json', nullable: true })
  @Field(() => [DishOption], { nullable: true })
  options: DishOption[];
}

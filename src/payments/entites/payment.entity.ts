import { Field, ID, InputType, ObjectType } from '@nestjs/graphql';
import { IsString } from 'class-validator';
import { Column, Entity, ManyToOne, RelationId } from 'typeorm';
import { CoreEntity } from '../../common/entities/core.entity';
import { Restaurant } from '../../restaurants/entities/restaurant.entity';
import { User } from '../../users/entities/user.entity';

@InputType('PaymentInputType', { isAbstract: true })
@ObjectType()
@Entity()
export class Payment extends CoreEntity {
  @Column()
  @Field(() => String)
  @IsString()
  transactionId: string;

  @ManyToOne(
    () => User,
    (user) => user.payments,
  )
  @Field(() => User)
  user: User;

  @RelationId((payment: Payment) => payment.user)
  userId: number;

  @ManyToOne(() => Restaurant)
  @Field(() => Restaurant)
  restaurant: Restaurant;

  @RelationId((payment: Payment) => payment.restaurant)
  @Field(() => ID)
  restaurantId: number;
}

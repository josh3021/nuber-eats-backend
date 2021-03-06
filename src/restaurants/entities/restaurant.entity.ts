import { Field, InputType, ObjectType } from '@nestjs/graphql';
import { IsBoolean, IsDate, IsString, Length } from 'class-validator';
import { Column, Entity, ManyToOne, OneToMany, RelationId } from 'typeorm';
import { CoreEntity } from '../../common/entities/core.entity';
import { Order } from '../../orders/entities/order.entity';
import { User } from '../../users/entities/user.entity';
import { Category } from './category.entity';
import { Dish } from './dish.entity';

@InputType('RestaurantInputType', { isAbstract: true })
@ObjectType()
@Entity()
export class Restaurant extends CoreEntity {
  @Column()
  @Field(() => String)
  @IsString()
  @Length(1, 25)
  name: string;

  @Column()
  @Field(() => String)
  @IsString()
  address: string;

  @Column()
  @Field(() => String)
  @IsString()
  coverImage: string;

  @ManyToOne(
    () => Category,
    (category) => category.restaurants,
    { nullable: true, onDelete: 'SET NULL' },
  )
  @Field(() => Category, { nullable: true })
  category: Category;

  @ManyToOne(
    () => User,
    (user) => user.restaurants,
  )
  @Field(() => User)
  owner: User;

  @RelationId((restaurant: Restaurant) => restaurant.owner)
  ownerId: number;

  @OneToMany(
    () => Order,
    (order) => order.restaurant,
    {
      onDelete: 'CASCADE',
    },
  )
  @Field(() => [Order])
  orders: Order[];

  @OneToMany(
    () => Dish,
    (dish) => dish.restaurant,
  )
  @Field(() => [Dish])
  menu: Dish[];

  @Column({ default: false })
  @Field(() => Boolean)
  @IsBoolean()
  isPromoted: boolean;

  @Column({ nullable: true })
  @Field(() => Date, { nullable: true })
  @IsDate()
  promotedUntil?: Date;
}

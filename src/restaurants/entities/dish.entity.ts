import { Field, InputType, Int, ObjectType } from '@nestjs/graphql';
import { IsArray, IsInt, IsNumber, IsString, Length } from 'class-validator';
import { Column, Entity, ManyToOne, RelationId } from 'typeorm';
import { CoreEntity } from '../../common/entities/core.entity';
import { Restaurant } from './restaurant.entity';

@InputType('DishInputType', { isAbstract: true })
@ObjectType()
@Entity()
export class Dish extends CoreEntity {
  @Column({ unique: true })
  @Field(() => String)
  @IsString()
  @Length(1, 15)
  name: string;

  @Column()
  @Field(() => Int)
  @IsNumber()
  price: number;

  @Column({ nullable: true })
  @Field(() => String, { nullable: true })
  @IsString()
  photo: string;

  @Column()
  @Field(() => String)
  @IsString()
  @Length(5, 150)
  description: string;

  @ManyToOne(
    () => Restaurant,
    (restaurant) => restaurant.menu,
    { onDelete: 'CASCADE', nullable: false },
  )
  @Field(() => Restaurant, { nullable: false })
  restaurant: Restaurant;

  @RelationId((dish: Dish) => dish.restaurant)
  restaurantId: number;

  @Column({ type: 'json', nullable: true })
  @Field(() => [DishOption], { nullable: true })
  options: DishOption[];
}

@InputType('DishOptionInputType', { isAbstract: true })
@ObjectType()
export class DishOption {
  @Field(() => String)
  @IsString()
  name: string;

  @Field(() => [DishChoice], { nullable: true })
  @IsArray()
  choices?: DishChoice[];

  @Field(() => Int, { nullable: true })
  @IsInt()
  extra?: number;
}

@InputType('DishChoiceInputType', { isAbstract: true })
@ObjectType()
export class DishChoice {
  @Field(() => String)
  @IsString()
  name: string;

  @Field(() => Int, { nullable: true })
  @IsInt()
  extra?: number;
}

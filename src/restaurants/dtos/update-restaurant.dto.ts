/* eslint-disable @typescript-eslint/no-unused-vars */
import { Field, InputType, PartialType } from '@nestjs/graphql';
import { CreateRestaurantDto } from './create-restaurant.dto';

@InputType()
export class UpdateRestaurantInputType extends PartialType(
  CreateRestaurantDto,
) {}

@InputType()
export class UpdateRestaurantDto {
  @Field(_type => Number)
  id: number;

  @Field(_type => UpdateRestaurantInputType)
  data: UpdateRestaurantInputType;
}

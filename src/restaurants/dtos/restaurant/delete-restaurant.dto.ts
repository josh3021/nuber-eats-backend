import { ArgsType, Field, ID, ObjectType } from '@nestjs/graphql';
import { CoreOutput } from '../../../common/dtos/output.dto';

@ArgsType()
export class DeleteRestaurantInput {
  @Field(() => ID)
  restaurantId: number;
}

@ObjectType()
export class DeleteRestaurantOutput extends CoreOutput {}

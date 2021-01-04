import { Field, ID, InputType, ObjectType, PickType } from '@nestjs/graphql';
import { CoreOutput } from '../../../common/dtos/output.dto';
import { Dish } from '../../entities/dish.entity';
@InputType()
export class UpdateDishInput extends PickType(Dish, [
  'name',
  'options',
  'price',
  'description',
]) {
  @Field(() => ID)
  dishId: number;
}

@ObjectType()
export class UpdateDishOutput extends CoreOutput {}

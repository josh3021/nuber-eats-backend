import { Field, ID, InputType, ObjectType } from '@nestjs/graphql';
import { CoreOutput } from '../../../common/dtos/output.dto';

@InputType()
export class DeleteDishInput {
  @Field(() => ID)
  dishId: number;
}

@ObjectType()
export class DeleteDishOutput extends CoreOutput {}

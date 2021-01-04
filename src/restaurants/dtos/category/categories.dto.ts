import { Field, ObjectType } from '@nestjs/graphql';
import { CoreOutput } from '../../../common/dtos/output.dto';
import { Category } from '../../entities/category.entity';

@ObjectType()
export class CategoriesOutput extends CoreOutput {
  @Field(() => [Category], { nullable: true })
  categories?: Category[];
}

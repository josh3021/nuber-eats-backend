import { ArgsType, Field, ID, ObjectType } from '@nestjs/graphql';
import { CoreOutput } from 'src/common/dtos/output.dto';
import { User } from '../entities/user.entity';

@ArgsType()
export class UserAccountInput {
  @Field(() => ID)
  id: number;
}

@ObjectType()
export class UserAccountOutput extends CoreOutput {
  @Field(() => User, { nullable: true })
  user?: User;
}

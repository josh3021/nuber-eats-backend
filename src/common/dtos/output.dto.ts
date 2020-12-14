import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class MutationOutput {
  @Field(() => Boolean)
  result: boolean;
  @Field(() => String, { nullable: true })
  error?: string;
}

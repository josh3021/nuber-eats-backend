import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class CoreOutput {
  @Field(() => Boolean)
  result: boolean;
  @Field(() => String, { nullable: true })
  error?: string;
}

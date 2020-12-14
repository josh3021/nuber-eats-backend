import { Field } from '@nestjs/graphql';

export class CommonReturnType {
  @Field(() => Boolean)
  result: boolean;
  @Field(() => String, { nullable: true })
  error?: string;
}

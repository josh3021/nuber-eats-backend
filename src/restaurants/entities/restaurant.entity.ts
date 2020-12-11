/* eslint-disable @typescript-eslint/no-unused-vars */
import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class Restaurant {
  @Field(_returns => String)
  name: string;

  @Field(_returns => String)
  address: string;

  @Field(_returns => Boolean)
  isVegan: boolean;

  @Field(_returns => String)
  ownerName: string;
}

/* eslint-disable @typescript-eslint/no-unused-vars */
import { ArgsType, Field } from '@nestjs/graphql';
import { IsBoolean, IsString, Length } from 'class-validator';

@ArgsType()
export class CreateRestaurantDto {
  @Field(type => String)
  @IsString()
  @Length(1, 30)
  name: string;

  @Field(type => String)
  @IsString()
  address: string;

  @Field(type => String)
  @IsString()
  @Length(1, 30)
  ownerName: string;

  @Field(type => Boolean)
  @IsBoolean()
  isVegan: boolean;
}

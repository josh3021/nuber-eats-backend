/* eslint-disable @typescript-eslint/no-unused-vars */
import { Field, InputType, ObjectType } from '@nestjs/graphql';
import { IsBoolean, IsOptional, IsString, Length } from 'class-validator';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@InputType({ isAbstract: true })
@ObjectType()
@Entity()
export class Restaurant {
  @Field((_type) => Number)
  @PrimaryGeneratedColumn()
  id: number;

  @Field((_type) => String)
  @Column()
  @IsString()
  @Length(1, 25)
  name: string;

  @Field((_type) => String)
  @Column()
  @IsString()
  address: string;

  @Field((_type) => Boolean, { defaultValue: false })
  @Column({ default: false })
  @IsOptional()
  @IsBoolean()
  isVegan: boolean;

  @Field((_type) => String)
  @Column()
  @IsString()
  @Length(1, 25)
  ownerName: string;

  @Field((_type) => String)
  @Column()
  @IsString()
  @Length(1, 10)
  categoryName: string;
}

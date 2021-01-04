import { Field, InputType, ObjectType } from '@nestjs/graphql';
import { IsString, Length } from 'class-validator';
import { Column, Entity, OneToMany } from 'typeorm';
import { CoreEntity } from '../../common/entities/core.entity';
import { Restaurant } from './restaurant.entity';

@InputType('CategoryInputType', { isAbstract: true })
@ObjectType()
@Entity()
export class Category extends CoreEntity {
  @Column({ unique: true })
  @Field(() => String)
  @IsString()
  @Length(10)
  name: string;

  @Column({ nullable: true })
  @Field(() => String, { nullable: true })
  @IsString()
  coverImage: string;

  @Column({ unique: true })
  @Field(() => String)
  @IsString()
  slug: string;

  @OneToMany(
    () => Restaurant,
    (restaurant) => restaurant.category,
  )
  @Field(() => [Restaurant])
  restaurants: Restaurant[];
}

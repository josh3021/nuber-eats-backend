import { InternalServerErrorException } from '@nestjs/common';
import {
  Field,
  InputType,
  ObjectType,
  registerEnumType,
} from '@nestjs/graphql';
import { compare, hash } from 'bcrypt';
import { IsBoolean, IsEmail, IsEnum, IsString } from 'class-validator';
import { BeforeInsert, BeforeUpdate, Column, Entity, OneToMany } from 'typeorm';
import { CoreEntity } from '../../common/entities/core.entity';
import { Order } from '../../orders/entities/order.entity';
import { Payment } from '../../payments/entites/payment.entity';
import { Restaurant } from '../../restaurants/entities/restaurant.entity';
import { UserRole } from '../dtos/role.dto';

registerEnumType(UserRole, { name: 'UserRole' });

@InputType('UserInputType', { isAbstract: true })
@ObjectType()
@Entity()
export class User extends CoreEntity {
  @Column({ unique: true })
  @Field(() => String)
  @IsEmail()
  email: string;

  @Column({ select: false })
  @Field(() => String)
  @IsString()
  password: string;

  @Column({ type: 'enum', enum: UserRole })
  @Field(() => UserRole)
  @IsEnum(UserRole)
  role: UserRole;

  @Column({ default: false })
  @Field(() => Boolean)
  @IsBoolean()
  verified: boolean;

  @OneToMany(
    () => Restaurant,
    (restaurant) => restaurant.owner,
    {
      onDelete: 'CASCADE',
      nullable: true,
    },
  )
  @Field(() => [Restaurant], { nullable: true })
  restaurants?: Restaurant[];

  @OneToMany(
    () => Order,
    (order) => order.customer,
    {
      onDelete: 'CASCADE',
      nullable: true,
    },
  )
  @Field(() => [Order], { nullable: true })
  orders?: Order[];

  @OneToMany(
    () => Payment,
    (payment) => payment.user,
    {
      onDelete: 'CASCADE',
      nullable: true,
    },
  )
  @Field(() => [Payment], { nullable: true })
  payments?: Payment[];

  @OneToMany(
    () => Order,
    (order) => order.driver,
    {
      onDelete: 'CASCADE',
      nullable: true,
    },
  )
  @Field(() => [Order], { nullable: true })
  rides?: Order[];

  @BeforeInsert()
  @BeforeUpdate()
  async hashPassword(): Promise<void> {
    if (this.password) {
      try {
        this.password = await hash(this.password, 10);
      } catch (e) {
        console.error(e);
        throw new InternalServerErrorException();
      }
    }
  }

  async checkPassword(inputPassword: string): Promise<boolean> {
    try {
      return await compare(inputPassword, this.password);
    } catch (e) {
      console.error(e);
      throw new InternalServerErrorException();
    }
  }
}

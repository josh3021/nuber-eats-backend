import { InternalServerErrorException } from '@nestjs/common';
import {
  Field,
  InputType,
  ObjectType,
  registerEnumType
} from '@nestjs/graphql';
import { compare, hash } from 'bcrypt';
import { IsBoolean, IsEmail, IsEnum, IsString } from 'class-validator';
import { BeforeInsert, BeforeUpdate, Column, Entity } from 'typeorm';
import { CoreEntity } from '../../common/entities/core.entity';
import { UserRole } from '../dtos/role.dto';

registerEnumType(UserRole, { name: 'UserRole' });

@InputType({ isAbstract: true })
@ObjectType()
@Entity()
export class User extends CoreEntity {
  @Column()
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

  @Column({default: false})
  @Field(() => Boolean)
  @IsBoolean()
  verified: boolean;

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

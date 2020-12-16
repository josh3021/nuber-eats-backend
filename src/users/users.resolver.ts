/* eslint-disable @typescript-eslint/no-unused-vars */
import { UseGuards } from '@nestjs/common';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { AuthUser } from 'src/auth/auth-user.decorator';
import { AuthGuard } from 'src/auth/auth.guard';
import {
  CreateAccountInput,
  CreateAccountOutput
} from './dtos/create-account.dto';
import { DeleteAccountOutput } from './dtos/delete-account.dto';
import { LoginInput, LoginOutput } from './dtos/login.dto';
import { updateAccountInput, updateAccountOutput } from './dtos/update-profile.dto';
import { UserProfileInput, UserProfileOutput } from './dtos/user-profile.dto';
import { User } from './entities/user.entity';
import { UsersService } from './users.service';
@Resolver(() => User)
export class UsersResolver {
  constructor(private readonly usersService: UsersService) {}

  @Query(() => User)
  @UseGuards(AuthGuard)
  me(@AuthUser() authorizedUser: User): User {
    return authorizedUser;
  }

  @Query(() => UserProfileOutput)
  @UseGuards(AuthGuard)
  async userProfile(@Args() userProfileInput: UserProfileInput): Promise<UserProfileOutput> {
    try {
      const user = await this.usersService.findById(userProfileInput.id);
      if(!user){
        throw Error('Can not find user')
      }
      return {
        result: true,
        user
      }
    } catch(error) {
      return {
        result: false,
        error
      }
    }
  }

  @Mutation(() => LoginOutput)
  async login(@Args('input') loginInput: LoginInput): Promise<LoginOutput> {
    try {
      return this.usersService.login(loginInput);
    } catch (error) {
      return {
        result: false,
        error,
      };
    }
  }

  @Mutation(() => CreateAccountOutput)
  async createAccount(
    @Args('input') createAccountInput: CreateAccountInput,
  ): Promise<CreateAccountOutput> {
    try {
      return this.usersService.createAccount(createAccountInput);
    } catch (error) {
      return {
        result: false,
        error,
      };
    }
  }

  @Mutation(() => updateAccountOutput)
  @UseGuards(AuthGuard)
  async updateAccount(@AuthUser() authorizedUser, @Args('input') updateAccountInput: updateAccountInput): Promise<updateAccountOutput> {
    try {
      await this.usersService.updateAccount(authorizedUser['id'], updateAccountInput);
      return {
        result: true
      };
    } catch(error) {
      return {
        result: false,
        error
      }
    }
  }

  @Mutation(() => DeleteAccountOutput)
  @UseGuards(AuthGuard)
  async deleteAccount(@AuthUser() authorizedUser): Promise<DeleteAccountOutput> {
    try {
      await this.usersService.deleteAccount(authorizedUser['id']);
      return {
        result: true
      }
    } catch(error) {
      return {
        result: false,
        error
      }
    }
  }
}

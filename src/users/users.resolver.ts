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
import { UpdateAccountInput, UpdateAccountOutput } from './dtos/update-profile.dto';
import { UserProfileInput, UserProfileOutput } from './dtos/user-profile.dto';
import { VerifyEmailInput, VerifyEmailOutput } from './dtos/verify-email.dto';
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
  userProfile(@Args() userProfileInput: UserProfileInput): Promise<UserProfileOutput> {
    return this.usersService.findById(userProfileInput.id);
  }

  @Mutation(() => LoginOutput)
  login(@Args('input') loginInput: LoginInput): Promise<LoginOutput> {
    return this.usersService.login(loginInput);
  }

  @Mutation(() => CreateAccountOutput)
  createAccount(
    @Args('input') createAccountInput: CreateAccountInput,
  ): Promise<CreateAccountOutput> {
    return this.usersService.createAccount(createAccountInput);
  }

  @Mutation(() => UpdateAccountOutput)
  @UseGuards(AuthGuard)
  updateAccount(@AuthUser() authorizedUser, @Args('input') updateAccountInput: UpdateAccountInput): Promise<UpdateAccountOutput> {
    return this.usersService.updateAccount(authorizedUser['id'], updateAccountInput);
  }

  @Mutation(() => DeleteAccountOutput)
  @UseGuards(AuthGuard)
  deleteAccount(@AuthUser() authorizedUser): Promise<DeleteAccountOutput> {
    return this.usersService.deleteAccount(authorizedUser['id']);
  }

  @Mutation(() => VerifyEmailOutput)
  verifyEmail(@Args('input') verifyEmailInput: VerifyEmailInput): Promise<VerifyEmailOutput> {
    return this.usersService.verifyEmail(verifyEmailInput.code);
  }
}

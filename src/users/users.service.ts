import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '../jwt/jwt.service';
import { CreateAccountInput, CreateAccountOutput } from './dtos/create-account.dto';
import { DeleteAccountOutput } from './dtos/delete-account.dto';
import { LoginInput, LoginOutput } from './dtos/login.dto';
import { UpdateAccountInput, UpdateAccountOutput } from './dtos/update-profile.dto';
import { UserProfileOutput } from './dtos/user-profile.dto';
import { VerifyEmailOutput } from './dtos/verify-email.dto';
import { User } from './entities/user.entity';
import { Verification } from './entities/verification.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
    @InjectRepository(Verification) private readonly verifications: Repository<Verification>,
    private readonly jwtService: JwtService,
  ) {}

  async createAccount({
    email,
    password,
    role,
  }: CreateAccountInput): Promise<CreateAccountOutput> {
    try {
      const existingUser = await this.users.findOne({
        email,
      }, {select: ['password']});
      if (existingUser) {
        // make an error
        return {
          result: false,
          error: 'There is an user with that email already',
        };
      }
      const user = await this.users.save(this.users.create({ email, password, role }));
      await this.verifications.save(this.verifications.create({
        user
      }));
      return { result: true };
    } catch (e) {
      return { result: false, error: `Could'nt create user: ${e}` };
    }
  }

  async updateAccount(id: number, {email, password}
  : UpdateAccountInput): Promise<UpdateAccountOutput> {
    try {
      const user = await this.users.findOne({id});
      if (email) {
        user.email = email;
        user.verified = false;
        await this.verifications.save(this.verifications.create({
          user
        }));
      }
      if (password) {
        user.password = password;
      }
      await this.users.save(user)
      return {
        result: true
      }
    } catch (error) {
      return {
        result: false,
        error
      }
    }
  }

  async deleteAccount(id: number): Promise<DeleteAccountOutput> {
    try {
      await this.users.delete(id);
      return {
        result: true
      }
    } catch (error) {
      return {
        result: false,
        error
      }
    }
  } 
  /**
   *
   * @param {email, password}
   * 1. find the user with the email
   * 2. check if the password is correct
   * 3. make a JWT and give it to the user
   */
  async login({ email, password }: LoginInput): Promise<LoginOutput> {
    try {
      const user = await this.users.findOne({ email }, {select: ['id', 'password']});
      if (!user) {
        return {
          result: false,
          error: 'User not found',
        };
      }

      if (!(await user.checkPassword(password))) {
        return {
          result: false,
          error: 'Wrong password!',
        };
      }
      return {
        result: true,
        token: this.jwtService.sign({ id: user.id }),
      };
    } catch (e) {
      return { result: false, error: `Could'nt login: ${e}` };
    }
  }

  async findById(id: number): Promise<UserProfileOutput> {
    try {
      const user = await this.users.findOne({ id });
      if (!user) {
        throw Error('Cannot find User')
      }
      return {
        result: true,
        user
      }
    } catch (error) {
      return {
        result: false,
        error
      }
    }
  }

  async verifyEmail(code: string): Promise<VerifyEmailOutput> {
    try {
      const verification = await this.verifications.findOne({code}, {relations: ['user']});
      if (verification) {
        verification.user.verified = true;
        await this.users.save(verification.user);
        await this.verifications.delete(verification.id)
        return {result: true};
      }
      throw new Error('Cannot find Verification')
    } catch (error) {
      return {
        result: false,
        error
      }
    }
  }
}

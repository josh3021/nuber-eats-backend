import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CommonReturnType } from '../common/dtos/return-type.dto';
import { JwtService } from '../jwt/jwt.service';
import { CreateAccountInput } from './dtos/create-account.dto';
import { LoginInput, LoginOutput } from './dtos/login.dto';
import { User } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
    private readonly jwtService: JwtService,
  ) {}

  async createAccount({
    email,
    password,
    role,
  }: CreateAccountInput): Promise<CommonReturnType> {
    try {
      const exists = await this.users.findOne({
        email,
      });
      if (exists) {
        // make an error
        return {
          result: false,
          error: 'There is an user with that email already',
        };
      }
      await this.users.save(this.users.create({ email, password, role }));
      return { result: true };
    } catch (e) {
      return { result: false, error: `Could'nt create user: ${e}` };
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
      const user = await this.users.findOne({ email });
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
        token: this.jwtService.sign({ userId: user.id }),
      };
    } catch (e) {
      return { result: false, error: `Could'nt login: ${e}` };
    }
  }
}

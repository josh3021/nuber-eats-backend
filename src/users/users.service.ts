import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MailService } from 'src/mail/mail.service';
import { Repository } from 'typeorm';
import { JwtService } from '../jwt/jwt.service';
import {
  CreateAccountInput,
  CreateAccountOutput,
} from './dtos/create-account.dto';
import { DeleteAccountOutput } from './dtos/delete-account.dto';
import { LoginInput, LoginOutput } from './dtos/login.dto';
import {
  UpdateAccountInput,
  UpdateAccountOutput,
} from './dtos/update-account.dto';
import { UserAccountOutput } from './dtos/user-profile.dto';
import { VerifyEmailOutput } from './dtos/verify-email.dto';
import { User } from './entities/user.entity';
import { Verification } from './entities/verification.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
    @InjectRepository(Verification)
    private readonly verifications: Repository<Verification>,
    private readonly jwtService: JwtService,
    private readonly mailService: MailService,
  ) {}

  // Test Verifed
  async createAccount({
    email,
    password,
    role,
  }: CreateAccountInput): Promise<CreateAccountOutput> {
    try {
      const existingUser = await this.users.findOne(
        {
          email,
        },
        { select: ['password'] },
      );
      if (existingUser) {
        // make an error
        return {
          result: false,
          error: 'There is an user with that email already.',
        };
      }
      const user = await this.users.save(
        this.users.create({ email, password, role }),
      );
      const verification = await this.verifications.save(
        this.verifications.create({
          user,
        }),
      );
      await this.mailService.sendVerificationEmail(
        user.email,
        verification.code,
      );
      return { result: true };
    } catch (error) {
      // Create Log system later...
      return {
        result: false,
        error: `Could not create an account. ${error}`,
      };
    }
  }

  async updateAccount(
    id: number,
    { email, password }: UpdateAccountInput,
  ): Promise<UpdateAccountOutput> {
    try {
      // id는 JWT에서 자신의 ID를 받아오는 것이기 때문에 오류가 날 수 없음. Test will be skipped :)
      const user = await this.users.findOne({ id });
      if (email) {
        user.email = email;
        user.verified = false;
        await this.verifications.delete({ user: { id: user.id } });
        const verification = await this.verifications.save(
          this.verifications.create({
            user,
          }),
        );
        await this.mailService.sendVerificationEmail(
          user.email,
          verification.code,
        );
      }
      if (password) {
        user.password = password;
      }
      await this.users.save(user);
      return {
        result: true,
      };
    } catch (error) {
      return {
        result: false,
        error: `Could not update user. ${error}`,
      };
    }
  }

  async deleteAccount(id: number): Promise<DeleteAccountOutput> {
    try {
      await this.users.delete(id);
      return {
        result: true,
      };
    } catch (error) {
      return {
        result: false,
        error: `Could not delete user. ${error}`,
      };
    }
  }
  /**
   *
   * @param {email, password}
   * 1. find the user with the email
   * 2. check if the password is correct
   * 3. make a JWT and give it to the user
   */
  // Test Verified
  async login({ email, password }: LoginInput): Promise<LoginOutput> {
    try {
      const user = await this.users.findOne(
        { email },
        { select: ['id', 'password'] },
      );
      if (!user) {
        return {
          result: false,
          error: 'User does not found.',
        };
      }

      if (!(await user.checkPassword(password))) {
        return {
          result: false,
          error: 'Password does not match.',
        };
      }
      return {
        result: true,
        token: this.jwtService.sign({ id: user.id }),
      };
    } catch (e) {
      return { result: false, error: `Could not login. ${e}` };
    }
  }

  // Test Verified
  async findById(id: number): Promise<UserAccountOutput> {
    try {
      const user = await this.users.findOne({ id }, {});
      if (!user) {
        return {
          result: false,
          error: `Could not find user have id: ${id}`,
        };
      }
      return {
        result: true,
        user,
      };
    } catch (error) {
      return {
        result: false,
        error: `Could not find user. ${error}`,
      };
    }
  }

  async verifyEmail(code: string): Promise<VerifyEmailOutput> {
    try {
      const verification = await this.verifications.findOne(
        { code },
        { relations: ['user'] },
      );
      if (verification) {
        verification.user.verified = true;
        await this.users.save(verification.user);
        await this.verifications.delete(verification.id);
        return { result: true };
      }
      throw new Error('Cannot find Verification.');
    } catch (error) {
      return {
        result: false,
        error: `Could not verify user. ${error}`,
      };
    }
  }
}

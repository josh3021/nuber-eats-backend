import { Inject, Injectable } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import { LoginJwtPayload } from './dtos/login-jwt.dto';
import { CONFIG_OPTIONS } from './jwt.constants';
import { JwtModuleOptions } from './jwt.interfaces';

@Injectable()
export class JwtService {
  constructor(
    @Inject(CONFIG_OPTIONS) private readonly options: JwtModuleOptions,
  ) {}
  /**
   *
   * @param payload
   * return signed JWT (payload must be JSON type)
   */
  sign({ userId }: LoginJwtPayload): string {
    return jwt.sign({ userId }, this.options.privateKey);
  }

  verify(token: string) {
    return jwt.verify(token, this.options.privateKey);
  }
}

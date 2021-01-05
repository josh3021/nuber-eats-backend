import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { UsersService } from 'src/users/users.service';
import { AUTH_TOKEN } from './jwt.constants';
import { JwtService } from './jwt.service';

@Injectable()
export class JwtMiddleware implements NestMiddleware {
  constructor(
    private readonly jwtSerivce: JwtService,
    private readonly usersService: UsersService,
  ) {}
  async use(req: Request, res: Response, next: NextFunction) {
    if (AUTH_TOKEN in req.headers) {
      const token = req.headers[AUTH_TOKEN];
      const verified = this.jwtSerivce.verify(token.toString());
      if (typeof verified === 'object' && verified.hasOwnProperty('id')) {
        try {
          const user = await this.usersService.findById(verified['id']);
          req['user'] = user;
        } catch (e) {
          console.error(e);
        }
      }
    }
    next();
  }
}

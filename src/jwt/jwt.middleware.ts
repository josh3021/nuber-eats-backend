import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { LOGIN_TOKEN } from './jwt.constants';
import { JwtService } from './jwt.service';

@Injectable()
export class JwtMiddleware implements NestMiddleware {
  constructor(private readonly jwtSerivce: JwtService) {}
  use(req: Request, res: Response, next: NextFunction) {
    if (LOGIN_TOKEN in req.headers) {
      const token = req.headers[LOGIN_TOKEN];
      const verified = this.jwtSerivce.verify(token.toString());
      if (typeof verified === 'object' && verified.hasOwnProperty('userId')) {
        console.log(JSON.stringify(verified));
      }
    }
    next();
  }
}

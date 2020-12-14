import { DynamicModule, Global, Module } from '@nestjs/common';
import { JwtModuleOptions } from '../../dist/jwt/interfaces/jwt-module-options.interface';
import { CONFIG_OPTIONS } from './jwt.constants';
import { JwtService } from './jwt.service';

@Module({
  providers: [JwtService],
})
@Global()
export class JwtModule {
  static forRoot(options: JwtModuleOptions): DynamicModule {
    return {
      module: JwtModule,
      exports: [JwtService],
      providers: [
        {
          provide: CONFIG_OPTIONS, //constant value
          useValue: options,
        },
        JwtService,
      ],
    };
  }
}

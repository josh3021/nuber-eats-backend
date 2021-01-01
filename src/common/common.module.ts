import { DynamicModule, Global, Module } from '@nestjs/common';
import { CommonService } from './common.service';

@Module({
  providers: [CommonService],
})
@Global()
export class CommonModule {
  static forRoot(): DynamicModule {
    return {
      module: CommonModule,
      exports: [CommonService],
      providers: [CommonService],
    };
  }
}

import { DynamicModule, Global, Module } from '@nestjs/common';
import { PubSub } from 'graphql-subscriptions';
import { CommonService } from './common.service';
import { PUB_SUB } from './pubsub.constants';

const pubsub = new PubSub();
@Global()
@Module({
  providers: [
    CommonService,
    {
      provide: PUB_SUB,
      useValue: pubsub,
    },
  ],
  exports: [PUB_SUB],
})
export class CommonModule {
  static forRoot(): DynamicModule {
    return {
      module: CommonModule,
      exports: [CommonService],
      providers: [CommonService],
    };
  }
}

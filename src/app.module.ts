import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { GraphQLModule } from '@nestjs/graphql';
import { TypeOrmModule } from '@nestjs/typeorm';
import { object, string } from 'joi';
import { CommonModule } from './common/common.module';
import { matchEnvFile } from './config/dotenv';
import { JwtMiddleware } from './jwt/jwt.middleware';
import { JwtModule } from './jwt/jwt.module';
import { User } from './users/entities/user.entity';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: matchEnvFile(process.env.ENV),
      ignoreEnvFile: process.env.NODE_ENV === 'prod',
      validationSchema: object({
        NODE_ENV: string()
          .valid('dev', 'test', 'prod')
          .required(),
        DB_HOST: string().required(),
        DB_PORT: string().required(),
        DB_USERNAME: string().required(),
        DB_PASSWORD: string().required(),
        DB_NAME: string().required(),
        PRIVATE_KEY: string().required(),
      }),
    }),
    GraphQLModule.forRoot({
      autoSchemaFile: true,
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST,
      port: +process.env.DB_PORT,
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      entities: [User],
      synchronize: process.env.NODE_ENV !== 'prod',
      logging: process.env.NODE_ENV !== 'prod',
    }),
    CommonModule,
    UsersModule,
    // Actually, you can just inject privateKey Object By Global Config Modules...
    // And I Recommend the Global Configuration Way one,
    // But, I will use this way, because it's for practice of making My Own Dynamic Module!
    JwtModule.forRoot({
      privateKey: process.env.PRIVATE_KEY,
    }),
  ],
  controllers: [],
  providers: [],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(JwtMiddleware).forRoutes({
      path: '/graphql',
      method: RequestMethod.ALL,
    });
  }
}

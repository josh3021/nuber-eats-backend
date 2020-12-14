import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { GraphQLModule } from '@nestjs/graphql';
import { TypeOrmModule } from '@nestjs/typeorm';
import { object, string } from 'joi';
import { CommonModule } from './common/common.module';
import { matchEnvFile } from './config/dotenv';
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
    UsersModule,
    CommonModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}

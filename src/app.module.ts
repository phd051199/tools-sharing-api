import { ApolloServerPluginLandingPageLocalDefault } from '@apollo/server/plugin/landingPage/default';
import {
  ApolloDriver,
  type ApolloDriverConfig,
  UserInputError,
} from '@nestjs/apollo';
import { BullModule } from '@nestjs/bullmq';
import { CacheModule } from '@nestjs/cache-manager';
import {
  ClassSerializerInterceptor,
  Module,
  type ValidationError,
  ValidationPipe,
} from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import { CqrsModule } from '@nestjs/cqrs';
import { GraphQLModule } from '@nestjs/graphql';
import { ScheduleModule } from '@nestjs/schedule';
import { MinioModule } from 'nestjs-minio-client';

import { formatGqlError } from '@/common/utils';
import {
  appConfiguration,
  type IRedisConfiguation,
  jwtConfiguration,
  minioConfiguration,
  type MinioOptions,
  redisConfiguration,
} from '@/config';
import { MINIO_CONF, REDIS_CONF } from '@/constants';
import { Env } from '@/env.validation';

import { AuthModule } from './auth/auth.module';
import { HealthModule } from './health/health.module';
import { PrismaModule } from './prisma/prisma.module';
import { ScriptExecModule } from './script-exec/script-exec.module';
import { TokenModule } from './token/token.module';
import { UserModule } from './user/user.module';
import { UserScriptModule } from './user-script/user-script.module';

@Module({
  imports: [
    CqrsModule.forRoot(),
    ConfigModule.forRoot({
      load: [
        appConfiguration,
        redisConfiguration,
        minioConfiguration,
        jwtConfiguration,
      ],
      isGlobal: true,
      validate: Env.validate,
    }),
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      plugins: [ApolloServerPluginLandingPageLocalDefault()],
      autoSchemaFile: true,
      playground: false,
      subscriptions: {
        'graphql-ws': true,
      },
      autoTransformHttpErrors: true,
      buildSchemaOptions: {
        numberScalarMode: 'integer',
      },
      formatError: formatGqlError,
    }),
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) =>
        configService.get<IRedisConfiguation>(REDIS_CONF),
    }),
    MinioModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) =>
        configService.get<MinioOptions>(MINIO_CONF),
    }),
    ScheduleModule.forRoot(),
    CacheModule.registerAsync<IRedisConfiguation>({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        ...configService.get<IRedisConfiguation>(REDIS_CONF),
        isGlobal: true,
      }),
    }),

    HealthModule,
    AuthModule,
    UserModule,
    PrismaModule,
    UserScriptModule,
    ScriptExecModule,
    TokenModule,
  ],
  providers: [
    {
      provide: APP_PIPE,
      useFactory: () =>
        new ValidationPipe({
          transform: true,
          exceptionFactory: (errors: ValidationError[]) =>
            new UserInputError('VALIDATION_ERROR', {
              extensions: {
                originalError: errors,
              },
            }),
        }),
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: ClassSerializerInterceptor,
    },
  ],
})
export class AppModule {}

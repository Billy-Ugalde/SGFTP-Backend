import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FairModule } from './modules/fairs/fairs.module';
import { EntrepreneurModule } from './modules/entrepreneurs/entrepreneur.module';
import { InformativeModule } from './modules/informative/informative.module';
import { SubscribersModule } from './modules/subscribers/subscribers.module';
import { NewsModule } from './modules/news/news.module';
import { UserModule } from './modules/users/user.module';
import { AuthModule } from './modules/auth/auth.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { SharedModule } from './modules/shared/shared.module';
import { GlobalSeedService } from './database/services/global-seed.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'mysql',
        host: configService.get<string>('DB_HOST'),
        port: configService.get<number>('DB_PORT'),
        username: configService.get<string>('DB_USERNAME'),
        password: configService.get<string>('DB_PASSWORD'),
        database: configService.get<string>('DB_DATABASE'),
        synchronize: configService.get<string>('NODE_ENV') === 'development',
        autoLoadEntities: true,
        ssl: false,
      }),
      inject: [ConfigService],
    }),FairModule, EntrepreneurModule, InformativeModule, SubscribersModule,NewsModule, UserModule, AuthModule, SharedModule],
  controllers: [AppController],
  providers: [AppService, GlobalSeedService],
})
export class AppModule { }

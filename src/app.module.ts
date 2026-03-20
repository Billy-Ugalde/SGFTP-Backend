import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditContextInterceptor } from './common/interceptors/audit-context.interceptor';
import { AuditContextSubscriber } from './common/subscribers/audit-context.subscriber';
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
import { MiddlewareConsumer, NestModule } from '@nestjs/common';
import { SecurityHeadersMiddleware } from './middleware/security-headers.middleware';
import { CorsMiddleware } from './middleware/cors.middleware';
import { NotificationsModule } from './modules/fairs-notifications/notifications.module';
import { ProjectModule } from './modules/projects/project.module';
import { NewslettersModule } from './modules/newsletters/newsletters.module';
import { VolunteerModule } from './modules/volunteers/volunteer.module';
import { DonationModule } from './modules/donations/donation.module';
import { AuditModule } from './modules/audit/audit.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ScheduleModule.forRoot(),
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
        subscribers: [AuditContextSubscriber],
      }),
      inject: [ConfigService],
    }),FairModule, EntrepreneurModule, InformativeModule, SubscribersModule,
    NewsModule, UserModule, AuthModule, SharedModule, NotificationsModule, ProjectModule, NewslettersModule, VolunteerModule, DonationModule, AuditModule],
  controllers: [AppController],
  providers: [
    AppService,
    GlobalSeedService,
    { provide: APP_INTERCEPTOR, useClass: AuditContextInterceptor },
  ],
})

export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(CorsMiddleware, SecurityHeadersMiddleware)
      .forRoutes('*');
  }
}

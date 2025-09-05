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

@Module({
  imports: [TypeOrmModule.forRoot({
    type: 'mysql',
    host: 'localhost',
    port: 3306,
    username: 'root',
    password: 'admin',
    database: 'data_prueba',
    ssl: false,
    autoLoadEntities: true,    //llama todas las entidades
    synchronize: true,
  }), FairModule, EntrepreneurModule, InformativeModule, SubscribersModule,NewsModule, UserModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }

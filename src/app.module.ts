import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FairModule } from './modules/fairs/fairs.module';
import { EntreprenuerModule } from './modules/entrepreneurs/entrepreneur.module';
import { InformativeModule } from './modules/informative/informative.module';
import { SubscribersModule } from './modules/subscribers/subscribers.module';

@Module({
  imports: [TypeOrmModule.forRoot({
    type: 'mysql',
    host: 'localhost',
    port: 3306,
    username: 'root',
    password: 'root',
    database: 'data_prueba',
    ssl: false,
    autoLoadEntities: true,    //llama todas las entidades
    synchronize: true,
  }), FairModule, EntreprenuerModule, InformativeModule, SubscribersModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }

import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FairModule } from './modules/fairs/fairs.module';
import { EntreprenuerModule } from './modules/entrepreneurs/entrepreneur.module';
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
  }), FairModule, EntreprenuerModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }

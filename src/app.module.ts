import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Fair } from './modules/fairs/entities/fair.entity';
import { FairModule } from './modules/fairs/fairs.module';
import { Stand } from './modules/fairs/entities/stand.entity';
import { Fair_enrollment } from './modules/fairs/entities/Fair_enrollment.entity';

@Module({
  imports: [TypeOrmModule.forRoot({
    type: 'mysql',
    host: 'localhost',
    port: 3306,
    username: 'root',
    password: 'admin',
    database: 'data_prueba',
    entities: [Fair, Stand, Fair_enrollment],
    synchronize: true,
  }), FairModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }

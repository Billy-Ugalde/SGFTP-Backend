import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Fair } from './modules/fairs/entities/fair.entity';
import { FairModule } from './modules/fairs/fairs.module';
import { Stand } from './modules/fairs/entities/stand.entity';
import { Fair_enrollment } from './modules/fairs/entities/Fair_enrollment.entity';
import { EntreprenuerModule } from './modules/entrepreneurs/entrepreneur.module';
import { Entreprenuer } from './modules/entrepreneurs/entities/entrepreneur.entitie';
import { Person } from './entities/person.entity';
@Module({
  imports: [TypeOrmModule.forRoot({
    type: 'mysql',
    host: 'localhost',
    port: 3306,
    username: 'root',
    password: 'admin',
    database: 'data_prueba',
    ssl: false,
    entities: [Fair, Stand, Fair_enrollment,Entreprenuer, Person],
    synchronize: true,
  }), FairModule,EntreprenuerModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }

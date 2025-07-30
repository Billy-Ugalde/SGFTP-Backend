import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InformativeModule } from '../modules/informative/informative.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: 'localhost',
      port: 3306,
      username: 'root',
      password: 'root',
      database: 'data_prueba',
      autoLoadEntities: true,
      synchronize: true,
    }),
    InformativeModule,
  ],
})
export class SeedModule {}

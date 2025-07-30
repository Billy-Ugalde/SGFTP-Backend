import { NestFactory } from '@nestjs/core';
import { SeedModule } from './seed.module';
import { DataSource } from 'typeorm';
import { seedInformativePage } from './seed-informative-page';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(SeedModule);
  const dataSource = app.get(DataSource);
  await seedInformativePage(dataSource);
  await app.close();
}

bootstrap();

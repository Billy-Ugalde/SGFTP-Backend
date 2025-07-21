import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,            
      forbidNonWhitelisted: true,  // Hace que en las peticiones HTPP en los json que se manden sean cabalmente como se definen en los dtos
      transform: true              
    }),
  );

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();


import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import * as cookieParser from 'cookie-parser';
import * as express from 'express'; 
import { join } from 'path';

async function bootstrap() {

  const app = await NestFactory.create(AppModule);
  app.use(cookieParser());

  app.enableCors({
    origin: 'http://localhost:5173',     //solo admite peticiones de esta dirección
    exposedHeaders: ['Content-Disposition'],
    credentials: true,
  });

  // Servir archivos estáticos desde la carpeta public
  app.use('/images', express.static(join(__dirname, '..', 'public', 'images')));


  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,  // Hace que en las peticiones HTPP en los json que se manden sean cabalmente como se definen en los dtos
      transform: true
    }),
  );
  await app.listen(process.env.PORT ?? 3001); // este puerto va a ser por defecto
}
bootstrap();
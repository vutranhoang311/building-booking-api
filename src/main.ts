import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { Logger } from 'nestjs-pino';
import { DataSource } from 'typeorm';

import { AppModule } from './app.module';
import { setupSwagger } from './config/swagger.config';
import { Building } from './entities/building.entity';
import { HttpExceptionFilter } from './filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });

  app.useLogger(app.get(Logger));

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.useGlobalFilters(new HttpExceptionFilter());

  app.setGlobalPrefix('api');
  setupSwagger(app);

   // Seed default Building A if it does not exist
  const dataSource = app.get(DataSource);
  const buildingRepository = dataSource.getRepository(Building);
  const existingBuildingA = await buildingRepository.findOne({
    where: { name: 'Building A' },
  });

  if (!existingBuildingA) {
    const buildingA = buildingRepository.create({
      name: 'Building A',
      description: 'Default building A',
    });
    await buildingRepository.save(buildingA);
  }

  const port = process.env.PORT || 3000;
  await app.listen(port);
}

bootstrap();


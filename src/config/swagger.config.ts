import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

export function setupSwagger(app: INestApplication): void {
  const config = new DocumentBuilder()
    .setTitle('Building Booking API')
    .setDescription(
      'RESTful API for hierarchical building locations and room booking',
    )
    .setVersion('1.0')
    .addTag('location', 'Hierarchical building/location management')
    .addTag('booking', 'Room booking')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);
}

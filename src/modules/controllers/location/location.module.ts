import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Building } from 'src/entities/building.entity';
import { Location } from '../../../entities/location.entity';
import { LocationController } from './location.controller';
import { LocationService } from './location.service';
import { LocationRepository } from './location.repository';

@Module({
  imports: [TypeOrmModule.forFeature([Location, Building])],
  controllers: [LocationController],
  providers: [LocationService, LocationRepository],
  exports: [TypeOrmModule],
})
export class LocationModule {}


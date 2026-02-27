import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Booking } from './booking.entity';
import { Location } from '../locations/location.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Booking, Location])],
  exports: [TypeOrmModule],
})
export class BookingsModule {}


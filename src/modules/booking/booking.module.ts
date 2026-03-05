import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Booking } from 'src/entities/booking.entity';
import { Location } from 'src/entities/location.entity';

import { BookingController } from './api/http/controller/booking.controller';
import { BookingService } from './domain/service/booking.service';

@Module({
  imports: [TypeOrmModule.forFeature([Booking, Location])],
  controllers: [BookingController],
  providers: [BookingService],
  exports: [TypeOrmModule, BookingService],
})
export class BookingModule { }


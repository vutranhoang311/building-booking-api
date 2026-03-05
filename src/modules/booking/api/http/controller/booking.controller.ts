import { Body, Controller, Post } from '@nestjs/common';
import { ApiCreatedResponse, ApiOperation, ApiTags } from '@nestjs/swagger';

import { BookingService } from 'src/modules/booking/domain/service/booking.service';

import { BookingResponseDto } from '../dto/booking-response.dto';
import { CreateBookingDto } from '../dto/create-booking.dto';

@ApiTags('booking')
@Controller('booking')
export class BookingController {
  constructor(private readonly bookingService: BookingService) { }

  @Post()
  @ApiOperation({ summary: 'Create a new booking' })
  @ApiCreatedResponse({
    description: 'Booking created',
    type: BookingResponseDto,
  })
  async create(@Body() dto: CreateBookingDto): Promise<BookingResponseDto> {
    return this.bookingService.create(dto);
  }
}


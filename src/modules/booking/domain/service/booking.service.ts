import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import dayjs from "dayjs";
import { Repository } from "typeorm";

import { Booking } from "src/entities/booking.entity";
import { Location } from "src/entities/location.entity";
import { BookingResponseDto } from "src/modules/booking/api/http/dto/booking-response.dto";
import { CreateBookingDto } from "src/modules/booking/api/http/dto/create-booking.dto";
import { LocationOpenDays } from "src/modules/location/api/http/dto/create-location.dto";

@Injectable()
export class BookingService {
  constructor(
    @InjectRepository(Booking)
    private readonly bookingRepository: Repository<Booking>,
    @InjectRepository(Location)
    private readonly locationRepository: Repository<Location>,
  ) { }

  async create(dto: CreateBookingDto): Promise<BookingResponseDto> {
    const location = await this.locationRepository.findOne({
      where: { id: dto.locationId },
    });

    if (!location) {
      throw new NotFoundException(`Location ${dto.locationId} not found`);
    }

    this.ensureLocationHasBookingConfig(location);
    this.validateBookingAgainstLocation(dto, location);
    this.ensureBookingInFuture(dto.startAt);
    await this.ensureNoOverlappingBooking(dto, location);

    const booking = this.bookingRepository.create({
      title: dto.title,
      description: dto.description,
      department: dto.department,
      attendees: dto.attendees,
      startAt: dto.startAt,
      endAt: dto.endAt,
      location,
    });

    const saved = await this.bookingRepository.save(booking);
    return this.toResponseDto(saved);
  }

  private ensureBookingInFuture(startAt: Date): void {
    const now = dayjs();
    const start = dayjs(startAt);

    if (!start.isAfter(now)) {
      throw new BadRequestException("Booking startAt must be in the future");
    }
  }

  private async ensureNoOverlappingBooking(
    dto: CreateBookingDto,
    location: Location,
  ): Promise<void> {
    const conflicts = await this.bookingRepository
      .createQueryBuilder("booking")
      .leftJoin("booking.location", "location")
      .where("location.id = :locationId", { locationId: location.id })
      .andWhere("booking.startAt < :newEndAt", { newEndAt: dto.endAt })
      .andWhere("booking.endAt > :newStartAt", { newStartAt: dto.startAt })
      .getCount();

    if (conflicts > 0) {
      throw new BadRequestException(
        "Booking time overlaps with an existing booking for this location",
      );
    }
  }

  // Kept public so it can be directly unit-tested.
  validateBookingAgainstLocation(
    dto: CreateBookingDto,
    location: Location,
  ): void {
    this.validateDepartment(dto.department, location.department!);
    this.validateCapacity(dto.attendees, location.capacity!);
    this.validateTimeWindow(
      dto.startAt,
      dto.endAt,
      location.openTime!,
      location.openDays as LocationOpenDays,
    );
  }

  private ensureLocationHasBookingConfig(location: Location): void {
    if (!location.department) {
      throw new BadRequestException(
        "Location is not configured with a department for booking",
      );
    }

    if (location.capacity == null || location.capacity <= 0) {
      throw new BadRequestException(
        "Location capacity must be a positive integer for booking",
      );
    }

    if (!location.openTime) {
      throw new BadRequestException(
        "Location openTime is not configured for booking",
      );
    }

    if (!location.openDays) {
      throw new BadRequestException(
        "Location openDays is not configured for booking",
      );
    }
  }

  private validateDepartment(
    bookingDepartment: string,
    locationDepartment: string,
  ): void {
    const normalizedBookingDept = bookingDepartment.trim().toUpperCase();
    const normalizedLocationDept = locationDepartment.trim().toUpperCase();

    if (normalizedBookingDept !== normalizedLocationDept) {
      throw new BadRequestException(
        `Booking department "${bookingDepartment}" does not match room department "${locationDepartment}"`,
      );
    }
  }

  private validateCapacity(attendees: number, capacity: number): void {
    if (attendees <= 0) {
      throw new BadRequestException("attendees must be greater than 0");
    }

    if (attendees > capacity) {
      throw new BadRequestException(
        `Requested attendees (${attendees}) exceed room capacity (${capacity})`,
      );
    }
  }

  private validateTimeWindow(
    startAt: Date,
    endAt: Date,
    openTime: string,
    openDays: LocationOpenDays,
  ): void {
    const start = dayjs(startAt);
    const end = dayjs(endAt);

    if (!end.isAfter(start)) {
      throw new BadRequestException("endAt must be after startAt");
    }

    if (!start.isSame(end, "day")) {
      throw new BadRequestException(
        "Bookings must start and end on the same calendar day",
      );
    }

    const allowedDays = this.getAllowedDays(openDays);
    const startDay = start.day();
    const endDay = end.day();

    if (!allowedDays.includes(startDay) || !allowedDays.includes(endDay)) {
      throw new BadRequestException(
        `Booking day is not allowed for this location (openDays=${openDays})`,
      );
    }

    const { startHour, startMinute, endHour, endMinute } =
      this.parseOpenTime(openTime);

    const openStart = start
      .hour(startHour)
      .minute(startMinute)
      .second(0)
      .millisecond(0);
    const openEnd = start
      .hour(endHour)
      .minute(endMinute)
      .second(0)
      .millisecond(0);

    if (start.isBefore(openStart) || end.isAfter(openEnd)) {
      throw new BadRequestException(
        `Booking time must be within openTime ${openTime}`,
      );
    }
  }

  private getAllowedDays(openDays: LocationOpenDays): number[] {
    switch (openDays) {
      case LocationOpenDays.MON_FRI:
        return [1, 2, 3, 4, 5];
      case LocationOpenDays.MON_SAT:
        return [1, 2, 3, 4, 5, 6];
      case LocationOpenDays.MON_SUN:
      case LocationOpenDays.ALWAYS:
        return [0, 1, 2, 3, 4, 5, 6];
      default:
        throw new BadRequestException(
          `Invalid openDays configuration: ${openDays}`,
        );
    }
  }

  private parseOpenTime(openTime: string): {
    startHour: number;
    startMinute: number;
    endHour: number;
    endMinute: number;
  } {
    const compact = openTime.replace(/\s+/g, "");
    const [start, end] = compact.split("-");

    if (!start || !end) {
      throw new BadRequestException(
        `Invalid openTime configuration: ${openTime}`,
      );
    }

    const [startHour, startMinute] = start.split(":").map(Number);
    const [endHour, endMinute] = end.split(":").map(Number);

    if (
      [startHour, startMinute, endHour, endMinute].some((v) => Number.isNaN(v))
    ) {
      throw new BadRequestException(
        `Invalid openTime configuration: ${openTime}`,
      );
    }

    return { startHour, startMinute, endHour, endMinute };
  }

  private toResponseDto(booking: Booking): BookingResponseDto {
    return {
      id: booking.id,
      locationId: booking.location.id,
      title: booking.title,
      description: booking.description,
      department: booking.department,
      attendees: booking.attendees,
      startAt: booking.startAt,
      endAt: booking.endAt,
      createdAt: booking.createdAt,
      updatedAt: booking.updatedAt,
    };
  }
}

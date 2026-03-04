import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDate,
  IsInt,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateBookingDto {
  @ApiProperty({
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    description: 'Location UUID',
  })
  @IsUUID()
  locationId!: string;

  @ApiProperty({ example: 'Weekly standup' })
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  title!: string;

  @ApiPropertyOptional({ example: 'Team sync-up meeting' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 'EFM' })
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  department!: string;

  @ApiProperty({ example: 8 })
  @IsInt()
  @IsPositive()
  attendees!: number;

  @ApiProperty({
    example: '2026-03-03T09:00:00.000Z',
    description: 'Booking start time (ISO 8601)',
  })
  @Type(() => Date)
  @IsDate()
  startAt!: Date;

  @ApiProperty({
    example: '2026-03-03T10:00:00.000Z',
    description: 'Booking end time (ISO 8601)',
  })
  @Type(() => Date)
  @IsDate()
  endAt!: Date;
}


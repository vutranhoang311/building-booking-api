import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class BookingResponseDto {
  @ApiProperty({
    example: 'b1c2d3e4-f5a6-7890-abcd-ef1234567890',
    description: 'Booking UUID',
  })
  id!: string;

  @ApiProperty({
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    description: 'Location UUID',
  })
  locationId!: string;

  @ApiProperty({ example: 'Weekly standup' })
  title!: string;

  @ApiPropertyOptional({ example: 'Team sync-up meeting' })
  description?: string;

  @ApiProperty({ example: 'EFM' })
  department!: string;

  @ApiProperty({ example: 8 })
  attendees!: number;

  @ApiProperty({
    example: '2026-03-03T09:00:00.000Z',
    description: 'Booking start time (ISO 8601)',
  })
  startAt!: Date;

  @ApiProperty({
    example: '2026-03-03T10:00:00.000Z',
    description: 'Booking end time (ISO 8601)',
  })
  endAt!: Date;

  @ApiProperty({
    example: '2026-03-01T10:00:00.000Z',
    description: 'Creation timestamp',
  })
  createdAt!: Date;

  @ApiProperty({
    example: '2026-03-01T10:00:00.000Z',
    description: 'Last update timestamp',
  })
  updatedAt!: Date;
}


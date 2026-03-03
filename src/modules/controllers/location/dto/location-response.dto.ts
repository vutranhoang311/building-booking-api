import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { LocationOpenDays } from './create-location.dto';

export class LocationResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  locationNumber!: string;

  @ApiPropertyOptional()
  buildingId?: string;

  @ApiPropertyOptional()
  buildingName?: string;

  @ApiPropertyOptional()
  department?: string;

  @ApiPropertyOptional()
  capacity?: number;

  @ApiPropertyOptional({
    description: 'Daily open time range in HH:mm-HH:mm',
  })
  openTime?: string;

  @ApiPropertyOptional({
    enum: LocationOpenDays,
    description: 'Allowed booking days (weekday pattern)',
  })
  openDays?: LocationOpenDays;

  @ApiPropertyOptional()
  description?: string;

  @ApiPropertyOptional()
  parentId?: string;

  @ApiPropertyOptional({ type: () => [LocationResponseDto] })
  children?: LocationResponseDto[];

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}


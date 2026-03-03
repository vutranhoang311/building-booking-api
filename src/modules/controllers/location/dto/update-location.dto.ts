import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';
import { CreateLocationDto, LocationOpenDays } from './create-location.dto';

export class UpdateLocationDto extends PartialType(CreateLocationDto) {
  @ApiPropertyOptional({ example: 'Meeting Room 1 (updated)' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  override name?: string;

  @ApiPropertyOptional({ example: 'A-01-01' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  override locationNumber?: string;

  @ApiPropertyOptional({
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    description: 'Parent location UUID (for moving node)',
  })
  @IsOptional()
  @IsUUID()
  override parentId?: string;

  @ApiPropertyOptional({
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    description: 'Building UUID',
  })
  @IsOptional()
  @IsUUID()
  override buildingId?: string;

  @ApiPropertyOptional({ example: 'EFM' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  override department?: string;

  @ApiPropertyOptional({ example: '09:00-18:00' })
  @IsOptional()
  @IsString()
  @MaxLength(11)
  override openTime?: string;

  @ApiPropertyOptional({
    example: LocationOpenDays.MON_FRI,
    enum: LocationOpenDays,
  })
  @IsOptional()
  @IsEnum(LocationOpenDays)
  override openDays?: LocationOpenDays;

  @ApiPropertyOptional({ example: 10 })
  @IsOptional()
  @IsInt()
  @IsPositive()
  override capacity?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  override description?: string;
}


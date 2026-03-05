import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from "class-validator";

import { IsTimeRange } from "../../../../../validations/is-time-range.validator";

export enum LocationOpenDays {
  MON_FRI = "MON_FRI",
  MON_SAT = "MON_SAT",
  MON_SUN = "MON_SUN",
  ALWAYS = "ALWAYS",
}

export class CreateLocationDto {
  @ApiProperty({ example: "Meeting Room 1" })
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  name!: string;

  @ApiProperty({ example: "A-01-01" })
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  locationNumber!: string;

  @ApiPropertyOptional({ example: "a1b2c3d4-e5f6-7890-abcd-ef1234567890" })
  @IsOptional()
  @IsUUID()
  parentId?: string;

  @ApiPropertyOptional({
    example: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    description: "Building UUID",
  })
  @IsOptional()
  @IsUUID()
  buildingId?: string;

  @ApiPropertyOptional({ example: "EFM" })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  department?: string;

  @ApiPropertyOptional({
    example: "09:00-18:00",
    description: "Time range in HH:mm-HH:mm",
  })
  @IsOptional()
  @Transform(({ value }) =>
    typeof value === "string" ? value.replace(/\s+/g, "") : value,
  )
  @IsString()
  @MaxLength(11)
  @IsTimeRange()
  openTime?: string;

  @ApiPropertyOptional({
    example: LocationOpenDays.MON_FRI,
    enum: LocationOpenDays,
    description: `Allowed days for booking (weekday pattern):  
    MON_FRI: Monday to Friday
    MON_SAT: Monday to Saturday
    MON_SUN: Monday to Sunday
    ALWAYS: Always`,
  })
  @IsOptional()
  @IsEnum(LocationOpenDays)
  openDays?: LocationOpenDays;

  @ApiPropertyOptional({ example: 10 })
  @IsOptional()
  @IsInt()
  @IsPositive()
  capacity?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;
}


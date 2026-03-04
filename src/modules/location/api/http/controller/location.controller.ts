import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from "@nestjs/common";
import {
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from "@nestjs/swagger";

import { LocationService } from "../../../domain/service/location.service";
import { LocationResponseDto } from "../dto/location-response.dto";
import { UpdateLocationDto } from "../dto/update-location.dto";
import { CreateLocationDto } from "../dto/create-location.dto";

@ApiTags("location")
@Controller("location")
export class LocationController {
  constructor(private readonly locationService: LocationService) { }

  @Post()
  @ApiOperation({ summary: "Create a new location" })
  @ApiCreatedResponse({
    description: "Location created",
    type: LocationResponseDto,
  })
  async create(
    @Body() dto: CreateLocationDto,
  ): Promise<LocationResponseDto> {
    return this.locationService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: "Get full location tree" })
  @ApiOkResponse({
    description: "Nested tree of locations (roots with children)",
    type: [LocationResponseDto],
  })
  async findAll(): Promise<LocationResponseDto[]> {
    return this.locationService.findAllTree();
  }

  @Get(":id")
  @ApiOperation({ summary: "Get a location by id" })
  @ApiOkResponse({
    description: "Location details with parent and children",
    type: LocationResponseDto,
  })
  @ApiNotFoundResponse({ description: "Location not found" })
  async findOne(
    @Param("id", ParseUUIDPipe) id: string,
  ): Promise<LocationResponseDto> {
    return this.locationService.findOne(id);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Update a location" })
  @ApiOkResponse({
    description: "Updated location",
    type: LocationResponseDto,
  })
  @ApiNotFoundResponse({ description: "Location not found" })
  async update(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: UpdateLocationDto,
  ): Promise<LocationResponseDto> {
    return this.locationService.update(id, dto);
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Delete a location" })
  @ApiNoContentResponse({
    description: "Location deleted (cascades to children and bookings)",
  })
  @ApiNotFoundResponse({ description: "Location not found" })
  async remove(@Param("id", ParseUUIDPipe) id: string): Promise<void> {
    return this.locationService.remove(id);
  }
}


import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { Building } from "src/entities/building.entity";

import { Location as LocationEntity } from "../../../../entities/location.entity";
import {
  CreateLocationDto,
  LocationOpenDays,
} from "../../api/http/dto/create-location.dto";
import { LocationResponseDto } from "../../api/http/dto/location-response.dto";
import { UpdateLocationDto } from "../../api/http/dto/update-location.dto";
import { LocationRepository } from "../../database/repository/location.repository";

type LocationTreeNode = LocationEntity & { children: LocationTreeNode[] };

@Injectable()
export class LocationService {
  constructor(
    private readonly locationRepository: LocationRepository,
    @InjectRepository(Building)
    private readonly buildingRepository: Repository<Building>,
  ) {}

  async create(dto: CreateLocationDto): Promise<LocationResponseDto> {
    if (dto.parentId) {
      const parent = await this.locationRepository.findOne({
        where: { id: dto.parentId },
      });
      if (!parent) {
        throw new NotFoundException(
          `Parent location ${dto.parentId} not found`,
        );
      }
    }

    if (dto.buildingId) {
      const building = await this.buildingRepository.findOne({
        where: { id: dto.buildingId },
      });
      if (!building) {
        throw new NotFoundException(`Building ${dto.buildingId} not found`);
      }
    }

    const existing = await this.locationRepository.findOne({
      where: { locationNumber: dto.locationNumber },
    });
    if (existing) {
      throw new ConflictException(
        `Location with number "${dto.locationNumber}" already exists`,
      );
    }

    const location = this.locationRepository.create({
      name: dto.name,
      locationNumber: dto.locationNumber,
      parent: dto.parentId
        ? ({ id: dto.parentId } as LocationEntity)
        : undefined,
      building: dto.buildingId
        ? ({ id: dto.buildingId } as Building)
        : undefined,
      department: dto.department,
      openTime: dto.openTime,
      openDays: dto.openDays,
      capacity: dto.capacity,
      description: dto.description,
    });

    const saved = await this.locationRepository.save(location);
    const withRelations = await this.locationRepository.findOne({
      where: { id: saved.id },
      relations: ["parent", "children", "building"],
    });
    return this.toResponseDto(withRelations!);
  }

  async findAllTree(): Promise<LocationResponseDto[]> {
    const all = await this.locationRepository.find({
      relations: ["parent", "building"],
      order: { locationNumber: "ASC" },
    });

    const byId = new Map<string, LocationTreeNode>();

    for (const loc of all) {
      byId.set(loc.id, { ...(loc as LocationEntity), children: [] });
    }

    for (const loc of all) {
      const node = byId.get(loc.id)!;
      const parent = loc.parent;
      if (parent) {
        const parentNode = byId.get(parent.id);
        if (parentNode) {
          parentNode.children.push(node);
        }
      }
    }

    const roots = all
      .filter((location) => !location.parent)
      .map((location) => byId.get(location.id)!)
      .filter((node): node is LocationTreeNode => !!node);

    return roots.map((root) => this.toResponseDtoRecursive(root));
  }

  async findOne(id: string): Promise<LocationResponseDto> {
    const location = await this.locationRepository.findOne({
      where: { id },
      relations: ["parent", "children", "building"],
    });
    if (!location) {
      throw new NotFoundException(`Location ${id} not found`);
    }
    return this.toResponseDto(location);
  }

  async update(
    id: string,
    dto: UpdateLocationDto,
  ): Promise<LocationResponseDto> {
    const location = await this.locationRepository.findOne({
      where: { id },
      relations: ["parent", "children", "building"],
    });
    if (!location) {
      throw new NotFoundException(`Location ${id} not found`);
    }

    if (dto.buildingId !== undefined && dto.buildingId) {
      const building = await this.buildingRepository.findOne({
        where: { id: dto.buildingId },
      });
      if (!building) {
        throw new NotFoundException(`Building ${dto.buildingId} not found`);
      }
    }

    if (dto.parentId !== undefined) {
      if (dto.parentId === id) {
        throw new BadRequestException("Location cannot be its own parent");
      }
      if (dto.parentId) {
        let currentId: string | null = dto.parentId;
        while (currentId) {
          if (currentId === id) {
            throw new BadRequestException(
              "Parent would create a cycle in the location tree",
            );
          }
          const parent = await this.locationRepository.findOne({
            where: { id: currentId },
            relations: ["parent"],
          });
          currentId = parent?.parent?.id ?? null;
        }
      }
    }

    if (
      dto.locationNumber !== undefined &&
      dto.locationNumber !== location.locationNumber
    ) {
      const existing = await this.locationRepository.findOne({
        where: { locationNumber: dto.locationNumber },
      });
      if (existing) {
        throw new ConflictException(
          `Location with number "${dto.locationNumber}" already exists`,
        );
      }
    }

    if (dto.name !== undefined) location.name = dto.name;
    if (dto.locationNumber !== undefined)
      location.locationNumber = dto.locationNumber;
    if (dto.parentId !== undefined) {
      location.parent = dto.parentId
        ? ({ id: dto.parentId } as LocationEntity)
        : null;
    }
    if (dto.buildingId !== undefined) {
      location.building = dto.buildingId
        ? ({ id: dto.buildingId } as Building)
        : null;
    }
    if (dto.department !== undefined) location.department = dto.department;
    if (dto.openTime !== undefined) location.openTime = dto.openTime;
    if (dto.openDays !== undefined) location.openDays = dto.openDays;
    if (dto.capacity !== undefined) location.capacity = dto.capacity;
    if (dto.description !== undefined) location.description = dto.description;

    const saved = await this.locationRepository.save(location);
    const withRelations = await this.locationRepository.findOne({
      where: { id: saved.id },
      relations: ["parent", "children", "building"],
    });
    return this.toResponseDto(withRelations!);
  }

  async remove(id: string): Promise<void> {
    const location = await this.locationRepository.findOne({
      where: { id },
    });
    if (!location) {
      throw new NotFoundException(`Location ${id} not found`);
    }
    await this.locationRepository.remove(location);
  }

  private toResponseDto(loc: LocationEntity): LocationResponseDto {
    return {
      id: loc.id,
      name: loc.name,
      locationNumber: loc.locationNumber,
      buildingId: loc.building?.id ?? undefined,
      buildingName: loc.building?.name ?? undefined,
      department: loc.department ?? undefined,
      capacity: loc.capacity ?? undefined,
      openTime: loc.openTime ?? undefined,
      openDays: loc.openDays as LocationOpenDays | undefined,
      description: loc.description ?? undefined,
      parentId: loc.parent?.id ?? undefined,
      children: (loc.children ?? []).map((child) => this.toResponseDto(child)),
      createdAt: loc.createdAt,
      updatedAt: loc.updatedAt,
    };
  }

  private toResponseDtoRecursive(
    node: LocationTreeNode | LocationEntity,
  ): LocationResponseDto {
    return {
      id: node.id,
      name: node.name,
      locationNumber: node.locationNumber,
      buildingId: node.building?.id ?? undefined,
      buildingName: node.building?.name ?? undefined,
      department: node.department ?? undefined,
      capacity: node.capacity ?? undefined,
      openTime: node.openTime ?? undefined,
      openDays: node.openDays as LocationOpenDays | undefined,
      description: node.description ?? undefined,
      parentId: node.parent?.id ?? undefined,
      children: (node.children ?? []).map((child) =>
        this.toResponseDtoRecursive(child as LocationTreeNode | LocationEntity),
      ),
      createdAt: node.createdAt,
      updatedAt: node.updatedAt,
    };
  }
}


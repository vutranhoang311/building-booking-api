import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { FindOneOptions, Repository } from "typeorm";
import { Location } from "../../../../entities/location.entity";

@Injectable()
export class LocationRepository {
  constructor(
    @InjectRepository(Location)
    private readonly repo: Repository<Location>,
  ) {}

  findOne(options: FindOneOptions<Location>) {
    return this.repo.findOne(options);
  }

  find(options: {
    relations?: string[];
    order?: { locationNumber?: "ASC" };
  }) {
    return this.repo.find(options);
  }

  create(partial: Partial<Location>) {
    return this.repo.create(partial);
  }

  save(entity: Location) {
    return this.repo.save(entity);
  }

  remove(entity: Location) {
    return this.repo.remove(entity);
  }
}


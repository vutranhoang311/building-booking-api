import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { Booking } from './booking.entity';
import { Building } from './building.entity';

@Entity('location')
@Unique(['locationNumber'])
export class Location {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ length: 255 })
  name!: string;

  @Column({ length: 50 })
  locationNumber!: string;

  @Column({ length: 50, nullable: true })
  department?: string;

  @Column({ type: 'int', nullable: true })
  capacity?: number;

  // Time range in HH:mm-HH:mm, validated at DTO level
  @Column({ length: 11, nullable: true })
  openTime?: string;

  // Allowed days, e.g. MON_FRI, MON_SAT, MON_SUN, ALWAYS
  @Column({ length: 20, nullable: true })
  openDays?: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @ManyToOne(() => Location, (location) => location.children, {
    nullable: true,
    onDelete: 'CASCADE',
  })
  parent?: Location | null;

  @OneToMany(() => Location, (location) => location.parent)
  children?: Location[];

  @ManyToOne(() => Building, (building) => building.locations, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  building?: Building | null;

  @OneToMany(() => Booking, (booking) => booking.location)
  bookings?: Booking[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}

 

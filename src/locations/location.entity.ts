import { Column, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'locations' })
export class Location {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  name!: string;

  @Column({ nullable: true })
  description?: string | null;

  @ManyToOne(() => Location, (location) => location.children, {
    nullable: true,
    onDelete: 'CASCADE',
  })
  parent?: Location | null;

  @OneToMany(() => Location, (location) => location.parent)
  children!: Location[];
}


import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Person } from './person.entity';

export enum PhoneType {
  PERSONAL = 'personal',
  BUSINESS = 'business'
}

@Entity('phones')
export class Phone {
  @PrimaryGeneratedColumn()
  id_phone: number;

  @Column({ nullable: true })
  id_person: number;

  @Column({ type: 'varchar', length: 20 })
  number: string;

  @Column({
    type: 'enum',
    enum: PhoneType,
    default: PhoneType.PERSONAL
  })
  type: PhoneType;

  @Column({ type: 'boolean', default: true })
  is_primary: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @ManyToOne(() => Person, person => person.phones, {
    onDelete: 'CASCADE'
  })
  @JoinColumn({ name: 'id_person' })
  person: Person;
}
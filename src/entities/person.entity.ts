import { Entity, PrimaryGeneratedColumn, Column, OneToMany, OneToOne, CreateDateColumn, UpdateDateColumn} from 'typeorm';
import { Entrepreneur } from '../modules/entrepreneurs/entities/entrepreneur.entity';

@Entity()
export class Person {
  @PrimaryGeneratedColumn({ name: 'id_person' })
  id_person: number;

  @Column({ name: 'first_name', type: 'varchar', length: 50 })
  first_name: string;

  @Column({ name: 'second_name', type: 'varchar', length: 50, nullable: true })
  second_name: string;

  @Column({ name: 'first_lastname', type: 'varchar', length: 50 })
  first_lastname: string;

  @Column({ name: 'second_lastname', type: 'varchar', length: 50 })
  second_lastname: string;

  @Column({ type: 'varchar', length: 150, unique: true })
  email: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @Column({ name: 'phone_number', type: 'varchar', length: 20 })
  phone_number: string;

  @OneToOne(() => Entrepreneur, (entrepreneur) => entrepreneur.person)
  entrepreneur: Entrepreneur;
}

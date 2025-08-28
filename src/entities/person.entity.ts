import { Entity, PrimaryGeneratedColumn, Column, OneToMany, OneToOne } from 'typeorm';
import { Entrepreneur } from '../modules/entrepreneurs/entities/entrepreneur.entity';

@Entity()
export class Person {
  @PrimaryGeneratedColumn({ name: 'id_person' })
  id_person: number;

  @Column({ name: 'first_name', type: 'varchar', length: 50 })
  firstName: string;

  @Column({ name: 'second_name', type: 'varchar', length: 50, nullable: true })
  secondName: string;

  @Column({ name: 'first_lastname', type: 'varchar', length: 50 })
  firstLastname: string;

  @Column({ name: 'second_lastname', type: 'varchar', length: 50 })
  secondLastname: string;

  @Column({ type: 'varchar', length: 150, unique: true })
  email: string;

  @Column({ name: 'phone_number', type: 'varchar', length: 20 })
  phoneNumber: string;

  @OneToOne(() => Entrepreneur, (entrepreneur) => entrepreneur.person)
  entrepreneur: Entrepreneur;
}

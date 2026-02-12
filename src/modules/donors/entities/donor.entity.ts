import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';
import { DonationType, DonorInterest } from '../enums/donor.enum';

@Index(['Donation_details', 'first_name', 'first_lastname'], { unique: true })
@Entity()
export class Donor {
  @PrimaryGeneratedColumn()
  Id_donor: number;

  @Column({ name: 'first_name', type: 'varchar', length: 50 })
  first_name: string;

  @Column({ name: 'second_name', type: 'varchar', length: 50, nullable: true })
  second_name: string;

  @Column({ name: 'first_lastname', type: 'varchar', length: 50 })
  first_lastname: string;

  @Column({ name: 'second_lastname', type: 'varchar', length: 50 })
  second_lastname: string;

  @Column({
    type: 'enum',
    enum: DonationType,
    nullable: false
  })
  Donation_type: DonationType;

  @Column({
    type: 'enum',
    enum: DonorInterest,
    nullable: false
  })
  Interest: DonorInterest;

  @Column({ type: 'varchar', length: 250 })
  Donation_details: string;

  @Column({ type: 'varchar' })
  Email: string;

  @Column({ type: 'varchar' })
  Phone: string;

  @CreateDateColumn()
  Created_at: Date;

  @UpdateDateColumn()
  Updated_at: Date;
}

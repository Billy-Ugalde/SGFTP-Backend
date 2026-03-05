import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, OneToMany, Index } from 'typeorm';
import { DonorInterest } from '../enums/donor.enum';
import { Donation } from './donation.entity';

@Entity()
@Index(['Email'], { unique: true })
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
    enum: DonorInterest,
    nullable: false
  })
  Interest: DonorInterest;

  @Column({ type: 'varchar' })
  Email: string;

  @Column({ type: 'varchar' })
  Phone: string;

  @CreateDateColumn()
  Created_at: Date;

  @UpdateDateColumn()
  Updated_at: Date;

   @OneToMany(() => Donation, (donation) => donation.donor)
  donations: Donation[];
}

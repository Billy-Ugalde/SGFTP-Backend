import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { DonorInterest, DonorType } from '../enums/donor.enum';
import { Donation } from './donation.entity';

@Entity()
@Index(['email'], { unique: true })
export class Donor {
  @PrimaryGeneratedColumn()
  idDonor: number;

  @Column({ type: 'varchar', length: 50 })
  firstName: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  secondName: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  nameCompany: string;

  @Column({ type: 'varchar', length: 50 })
  firstLastName: string;

  @Column({ type: 'varchar', length: 50 })
  secondLastName: string;

  @Column({
    type: 'enum',
    enum: DonorType,
    nullable: false,
  })
  donorType: DonorType;

  @Column({
    type: 'enum',
    enum: DonorInterest,
    nullable: false,
  })
  interest: DonorInterest;

  @Column({ type: 'varchar' })
  email: string;

  @Column({ type: 'varchar' })
  phone: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => Donation, (donation) => donation.donor)
  donations: Donation[];
}

import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { DonationType, ReadStatus } from '../enums/donation.enum';
import { Donor } from './donor.entity';

@Entity()
export class Donation {
  @PrimaryGeneratedColumn()
  idDonation: number;

  @Column({
    type: 'enum',
    enum: DonationType,
    nullable: false
  })
  donationType: DonationType;

  @Column({ type: 'varchar', length: 250 })
  donationDetails: string;

  @Column({
    type: 'enum',
    enum: ReadStatus,
    default: ReadStatus.UNREAD
  })
  status: ReadStatus;

  @Column({ type: 'boolean', default: false })
  archived: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => Donor, (donor) => donor.donations, { nullable: false })
  @JoinColumn({ name: 'idDonor' })
  donor: Donor;
}

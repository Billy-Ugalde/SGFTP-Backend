import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { DonationType, ReadStatus } from '../enums/donation.enum';
import { Donor } from './donor.entity';

@Entity()
export class Donation {
  @PrimaryGeneratedColumn()
  Id_donation: number;

  @Column({
    type: 'enum',
    enum: DonationType,
    nullable: false
  })
  Donation_type: DonationType;

  @Column({ type: 'varchar', length: 250 })
  Donation_details: string;

  @Column({
    type: 'enum',
    enum: ReadStatus,
    default: ReadStatus.UNREAD
  })
  status: ReadStatus;

  @Column({ type: 'boolean', default: false })
  archived: boolean;

  @CreateDateColumn()
  Created_at: Date;

  @UpdateDateColumn()
  Updated_at: Date;

  @ManyToOne(() => Donor, (donor) => donor.donations, { nullable: false })
  @JoinColumn({ name: 'Id_donor' })
  donor: Donor;
}

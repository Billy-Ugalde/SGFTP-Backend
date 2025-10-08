import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum CampaignLanguage {
  SPANISH = 'spanish',
  ENGLISH = 'english'
}

export enum CampaignStatus {
  COMPLETED = 'completed',
  FAILED = 'failed',
  PARTIAL = 'partial'
}

@Entity('newsletter_campaigns')
export class NewsletterCampaign {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 100 })
  subject: string;

  @Column({ type: 'text' })
  content: string;

  @Column({
    type: 'enum',
    enum: CampaignLanguage
  })
  language: CampaignLanguage;

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'sent_by' })
  sentBy: User;

  @CreateDateColumn({ name: 'sent_at' })
  sentAt: Date;

  @Column({ type: 'int', default: 0 })
  totalRecipients: number;

  @Column({ type: 'int', default: 0 })
  successfulSends: number;

  @Column({ type: 'int', default: 0 })
  failedSends: number;

  @Column({
    type: 'enum',
    enum: CampaignStatus
  })
  status: CampaignStatus;

  @Column({ type: 'simple-json', nullable: true })
  errors: string[] | null;
}

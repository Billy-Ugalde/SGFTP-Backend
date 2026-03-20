import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum EmailStatus {
  PENDING = 'pending',
  SENT = 'sent',
  FAILED = 'failed',
  SUPPRESSED = 'suppressed',
}

export enum EmailErrorType {
  TEMPORARY = 'temporary',
  PERMANENT = 'permanent',
}

@Entity('email_log')
export class EmailLog {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  recipient: string;

  @Column()
  subject: string;

  @Column({ type: 'text' })
  htmlBody: string;

  @Column()
  module: string;

  @Column()
  emailType: string;

  @Column({
    type: 'enum',
    enum: EmailStatus,
    default: EmailStatus.PENDING,
  })
  status: EmailStatus;

  @Column({ default: 0 })
  retryCount: number;

  @Column({ default: 3 })
  maxRetries: number;

  @Column({ type: 'text', nullable: true })
  lastError: string | null;

  @Column({
    type: 'enum',
    enum: EmailErrorType,
    nullable: true,
  })
  errorType: EmailErrorType | null;

  @Column({ type: 'timestamp', nullable: true })
  nextAttemptAt: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  sentAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

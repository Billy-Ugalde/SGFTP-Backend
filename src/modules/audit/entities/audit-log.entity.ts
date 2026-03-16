import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { AuditAction, AuditSource } from '../enums/audit.enum';

@Index(['entity', 'entity_id'])
@Index(['user_id'])
@Index(['timestamp'])
@Entity('audit_log')
export class AuditLog {

  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @CreateDateColumn({ type: 'datetime' })
  timestamp: Date;

  @Column({ nullable: true })
  user_id: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  user_email: string | null;

  @Column({ type: 'simple-array', nullable: true })
  user_roles: string[];

  @Column({ type: 'enum', enum: AuditAction })
  action: AuditAction;

  @Column({ type: 'varchar', length: 100 })
  entity: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  entity_id: string;

  @Column({ type: 'json', nullable: true })
  old_value: Record<string, unknown> | null;

  @Column({ type: 'json', nullable: true })
  new_value: Record<string, unknown> | null;

  @Column({ type: 'enum', enum: AuditSource, default: AuditSource.HTTP_REQUEST })
  source: AuditSource;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'user_id' })
  user: User | null;
}

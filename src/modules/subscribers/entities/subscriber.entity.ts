import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export enum PreferredLanguage {
  SPANISH = 'es',
  ENGLISH = 'en'
}

@Entity('subscriber')
export class Subscriber {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  email: string;

  @Column({ name: 'first_name' })
  firstName: string;

  @Column({ name: 'last_name' })
  lastName: string;

  @Column({
    type: 'enum',
    enum: PreferredLanguage,
    default: PreferredLanguage.SPANISH,
    name: 'preferred_language'
  })
  preferredLanguage: PreferredLanguage;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
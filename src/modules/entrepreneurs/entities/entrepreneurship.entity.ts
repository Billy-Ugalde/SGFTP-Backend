import { Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Entrepreneur } from './entrepreneur.entity';

export enum EntrepreneurshipCategory {
  COMIDA = 'Comida',
  ARTESANIA = 'Artesanía',
  VESTIMENTA = 'Vestimenta',
  ACCESORIOS = 'Accesorios',
  DECORACION = 'Decoración',
  DEMOSTRACION = 'Demostración',
  OTRA = 'Otra categoría' 
}

export enum EntrepreneurshipApproach {
  SOCIAL = 'social',
  CULTURAL = 'cultural',
  AMBIENTAL = 'ambiental'
}

@Entity('entrepreneurships')
export class Entrepreneurship {
  @PrimaryGeneratedColumn()
  id_entrepreneurship: number;

  @Column({ nullable: true })
  id_entrepreneur: number;

  @Column({ length: 255 })
  name: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ length: 255 })
  location: string;

  @Column({
    type: 'enum',
    enum: EntrepreneurshipCategory,
    default: EntrepreneurshipCategory.COMIDA
  })
  category: EntrepreneurshipCategory;

  @Column({
    type: 'enum',
    enum: EntrepreneurshipApproach,
    default: EntrepreneurshipApproach.SOCIAL
  })
  approach: EntrepreneurshipApproach;

  @Column({ length: 500, nullable: true })
  url_1?: string;

  @Column({ length: 500, nullable: true })
  url_2?: string;

  @Column({ length: 500, nullable: true })
  url_3?: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @OneToOne(() => Entrepreneur, entrepreneur => entrepreneur.entrepreneurship, {
    onDelete: 'CASCADE'
  })
  @JoinColumn({ name: 'id_entrepreneur' })
  entrepreneur: Entrepreneur;
}
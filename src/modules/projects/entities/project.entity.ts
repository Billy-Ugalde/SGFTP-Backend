import { Column, CreateDateColumn, Entity, Index, JoinColumn, NumericType, OneToMany, PrimaryColumn, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { Decimal } from 'decimal.js';
import { Campaign } from "./campaign.entity";


@Index(['Name', 'registration_date'], { unique: true })
@Entity()

export class Project {
    @PrimaryGeneratedColumn()
    Id_project: number

    @Column({ type: 'varchar' })
    Name: string

    @Column({ type: 'varchar' })
    Description: string;

    @Column({ type: 'varchar' })
    Aim: string;

    @Column({ type: 'datetime' })
    Start_date: Date;

    @Column({ type: 'datetime', nullable: true })
    End_date?: Date;

    @CreateDateColumn()
    registration_date: Date;

    @UpdateDateColumn()
    UpdatedAt: Date;

    @Column({ type: 'enum', enum: ['Pendiente', 'Admitido', 'Rechazado', 'Planificación', 'Ejecución', 'Suspendido', 'Terminado'] })
    Status!: 'Pendiente' | 'Admitido' | 'Rechazado' | 'Planificación' | 'Ejecución' | 'Suspendido' | 'Terminado';

    @Column({ type: 'enum', enum: ['Inversión', 'Acción social'] })
    Type_project!: 'Inversión' | 'Acción social';

    @Column({ type: 'varchar' })
    Location: string;

    @Column('decimal', { precision: 12, scale: 2 })
    Total_budget: Decimal

    @Column()
    Active: boolean;

    @OneToMany(() => Campaign, (campaign) => campaign.project)
    campaign: Campaign[];
}



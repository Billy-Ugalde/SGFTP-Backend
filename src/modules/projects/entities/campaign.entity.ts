import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, NumericType, PrimaryColumn, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { Decimal } from 'decimal.js';
import { Project } from "./project.entity";


@Index(['Name', 'registration_date'], { unique: true })
@Entity()

export class Campaign {
    @PrimaryGeneratedColumn()
    Id: number

    @Column({ type: 'varchar' })
    Name: string

    @Column({ type: 'varchar' })
    Description: string;

    @CreateDateColumn()
    registration_date: Date;

    @UpdateDateColumn()
    UpdatedAt: Date;

    @Column({ type: 'enum', enum: ['Pendiente', 'Admitido', 'Rechazado', 'Planificación', 'Ejecución', 'Suspendido', 'Terminado'] })
    Status_campaign!: 'Pendiente' | 'Admitido' | 'Rechazado' | 'Planificación' | 'Ejecución' | 'Suspendido' | 'Terminado';

    @Column({ type: 'enum', enum: ['Social', 'Ambiental', 'Cultural'] })
    Approach!: 'Social' | 'Ambiental' | 'Cultural';

    @Column({ type: 'varchar' })
    Location: string;

    @Column('decimal', { precision: 12, scale: 2 })
    Budget_campaign: Decimal

    @Column()
    Active: boolean;

    @ManyToOne(() => Project, (project) => project.campaign, { nullable: false })
    @JoinColumn({ name: 'Id_project' })
    project: Project;
}
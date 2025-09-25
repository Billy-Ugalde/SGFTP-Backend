import {
    Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne,
    PrimaryGeneratedColumn, UpdateDateColumn
} from "typeorm";
import { Project } from "./project.entity";
import { CampaignStatus, MetricType, TypeApproach, TypeCampaign } from "../enums/campaign.enum";
@Index(['Name', 'Registration_date'], { unique: true })
@Entity()

export class Campaign {
    @PrimaryGeneratedColumn()
    Id: number;

    @Column({ type: 'varchar' })
    Name: string

    @Column({ type: 'varchar' })
    Description: string;

    @Column({ type: 'varchar' })
    Conditions: string;

    @Column({ type: 'varchar' })
    Observations: string;

    @Column({ default: false })
    IsRecurring: boolean;  // Si es true, mostrar múltiples fechas

    @Column({ default: false })
    OpenForRegistration: boolean;  // abierta o no a la inscripción

    @CreateDateColumn()
    Registration_date: Date;

    @UpdateDateColumn()
    UpdatedAt: Date;

    @Column({ type: 'datetime' })
    Start_date: Date;           //se va a implementar con una tabla de fechas

    @Column({ type: 'datetime', nullable: true })
    End_date: Date;             //se va a implementar con una tabla de fechas

    @Column({ nullable: false })
    Type_campaign: TypeCampaign;

    @Column({ nullable: false })
    Status_campaign: CampaignStatus;

    @Column({ nullable: false })
    Approach: TypeApproach;

    @Column({ nullable: true })
    Spaces: number    //cantidad de espacios es opcional porque no todo es limitado  pueden haber casos

    @Column({ type: 'varchar' })
    Location: string;

    @Column()
    Metric_campaign: MetricType;

    @Column()
    Active: boolean;

    @ManyToOne(() => Project, (project) => project.campaign, { nullable: false })
    @JoinColumn({ name: 'Id_project' })
    project: Project;
}
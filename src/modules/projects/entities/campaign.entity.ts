import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { Decimal } from 'decimal.js';
import { Project } from "./project.entity";
import { CampaignStatus, MetricType, ProposalStatus, TypeApproach, TypeCampaign } from "../enums/campaign.enum";
@Index(['Name', 'registration_date'], { unique: true })
@Entity()

export class Campaign {
    @PrimaryGeneratedColumn()
    Id: number;

    @Column({ type: 'varchar' })
    Name: string

    @Column({ type: 'varchar' })
    Description: string;

    @CreateDateColumn()
    Registration_date: Date;

    @UpdateDateColumn()
    UpdatedAt: Date;

    @Column({ nullable: false })
    Type_campign: TypeCampaign;

    @Column({ nullable: false })
    Status_campaign: CampaignStatus;

    @Column({ nullable: true })
    Campaign_proposal: ProposalStatus;   //no se como manejarlo por no tocar el tema de solicitudes en este momento

    @Column({ nullable: false })
    Approach: TypeApproach;

    @Column({ nullable: true })
    Spaces: number    //cantidad de espacios es opcional porque no todo es limitado

    @Column({ type: 'varchar' })
    Location: string;

    @Column('decimal', { precision: 12, scale: 2 })
    Budget_campaign: Decimal;   //se le debe asignar del presupuesto total del proyecto asociado

    @Column()
    Metric_campaign: MetricType;

    @Column()
    Active: boolean;

    @ManyToOne(() => Project, (project) => project.campaign, { nullable: false })
    @JoinColumn({ name: 'Id_project' })
    project: Project;
}
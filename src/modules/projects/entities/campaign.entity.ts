import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, NumericType, PrimaryColumn, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { Decimal } from 'decimal.js';
import { Project } from "./project.entity";

export enum TypeApproach {
    SOCIAL = 'social',
    CULTURAL = 'cultural',
    ENVIRONMENTAL = 'environmental'
}

export enum CampaigntStatus {
    PENDING = 'pending',
    APPROVED = 'approved',
    REJECTED = 'rejected',
    PLANNING = 'planning',
    EXECUTION = 'Execution',
    SUSPENDED = 'suspended',
    FINISHED = 'Finished'
}

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
    registration_date: Date;

    @UpdateDateColumn()
    UpdatedAt: Date;

    @Column()
    Status_campaign!: CampaigntStatus;

    @Column()
    Approach!: TypeApproach;

    @Column({ type: 'varchar' })
    Location: string;

    @Column('decimal', { precision: 12, scale: 2 })
    Budget_campaign: Decimal;

    @Column()
    Active: boolean;

    @ManyToOne(() => Project, (project) => project.campaign, { nullable: false })
    @JoinColumn({ name: 'Id_project' })
    project: Project;
}
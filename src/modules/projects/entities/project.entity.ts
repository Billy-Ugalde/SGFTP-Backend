import { Column, CreateDateColumn, Entity, Index, JoinColumn, NumericType, OneToMany, PrimaryColumn, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { Decimal } from 'decimal.js';
import { Campaign } from "./campaign.entity";

export enum ProjectStatus {
    PENDING = 'pending',
    APPROVED = 'approved',
    REJECTED = 'rejected',
    PLANNING = 'planning',
    EXECUTION = 'Execution',
    SUSPENDED = 'suspended',
    FINISHED = 'Finished'
}

export enum TypeProject {
    INVESTMENT = 'Investment',
    SOCIAL_ACTION = 'social action'
}

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

    @Column()
    Status!: ProjectStatus;

    @Column()
    Type_project!: TypeProject;

    @Column({ type: 'varchar' })
    Location: string;

    @Column('decimal', { precision: 12, scale: 2 })
    Total_budget: Decimal

    @Column()
    Active: boolean;

    @OneToMany(() => Campaign, (campaign) => campaign.project)
    campaign: Campaign[];
}



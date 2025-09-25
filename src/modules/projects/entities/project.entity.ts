import {
    Column, CreateDateColumn, Entity, Index, OneToMany,
    PrimaryGeneratedColumn, UpdateDateColumn
} from "typeorm";
import { Campaign } from "./campaign.entity";
import { MetricProject, ProjectStatus, TypeProject } from "../enums/project.enum";
@Index(['Name', 'Registration_date'], { unique: true })
@Entity()
export class Project {
    @PrimaryGeneratedColumn()
    Id_project: number

    @Column({ type: 'varchar' })
    Name: string

    @Column({ type: 'varchar' })
    Description: string;

    @Column({ type: 'varchar' })
    Observations: string;

    @Column({ type: 'varchar' })
    Aim: string;

    @Column({ type: 'datetime' })
    Start_date: Date;

    @Column({ type: 'datetime', nullable: true })
    End_date?: Date;

    @CreateDateColumn()
    Registration_date: Date;

    @UpdateDateColumn()
    UpdatedAt: Date;

    @Column({ nullable: false })
    Status: ProjectStatus;

    @Column({ nullable: false })
    Type_project: TypeProject;

    @Column({ nullable: false })
    Target_population: string;   //población objetivo a impactar con las campañas derivadas de este proyecto

    @Column({ type: 'varchar' })
    Location: string;            //ubicacion general

    @Column({ nullable: false })
    Metrics: MetricProject;

    @Column()
    Active: boolean;

    @OneToMany(() => Campaign, (campaign) => campaign.project)
    campaign: Campaign[];
}



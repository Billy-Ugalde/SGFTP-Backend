import {
    Column, CreateDateColumn, Entity, Index, OneToMany,
    PrimaryGeneratedColumn, UpdateDateColumn
} from "typeorm";
import { Activity } from "./activity.entity";
import { MetricProject, ProjectStatus } from "../enums/project.enum";
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
    Aim: string;    //objetivo

    @Column({ type: 'datetime' })
    Start_date: string;

    @Column({ type: 'datetime', nullable: true })
    End_date?: string;

    @CreateDateColumn()
    Registration_date: Date;

    @UpdateDateColumn()
    UpdatedAt: Date;

    @Column({
        type: 'enum',
        enum: ProjectStatus,
        default: ProjectStatus.PENDING,
        nullable: false
    })
    Status: ProjectStatus;

    @Column({ nullable: false })
    Target_population: string;   //población objetivo a impactar con las campañas derivadas de este proyecto

    @Column({ type: 'varchar' })
    Location: string;            //ubicacion general

    @Column({ nullable: false })
    Metrics: MetricProject;

    @Column({ nullable: false })
    Metric_value: number;

    @Column({default: false})
    Active: boolean;

    @OneToMany(() => Activity, (activity) => activity.project)
    activity: Activity[];
}



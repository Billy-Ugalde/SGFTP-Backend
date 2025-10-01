import {
    Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne,
    OneToMany,
    PrimaryGeneratedColumn, UpdateDateColumn
} from "typeorm";
import { Project } from "./project.entity";
import { ActivityStatus, MetricType, TypeActivity, TypeApproach, TypeFavorite } from "../enums/activity.enum";
import { DateActivity } from "src/modules/projects/entities/date.entity";
@Index(['Name', 'Registration_date'], { unique: true })
@Entity()

export class Activity {
    @PrimaryGeneratedColumn()
    Id_activity: number;

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

    @Column({ nullable: true })  // ← Agregar nullable: true
    IsFavorite?: TypeFavorite;   // ← Agregar ? para hacerlo opcional   //para  distingir las actividades favoritas, como escuelas y condominios

    @Column({ default: false })
    OpenForRegistration: boolean;  // abierta o no a la inscripción

    @CreateDateColumn()
    Registration_date: Date;

    @UpdateDateColumn()
    UpdatedAt: Date;

    @Column({ nullable: false })
    Type_activity: TypeActivity;

    @Column({
        type: 'enum',
        enum: ActivityStatus,
        default: ActivityStatus.PENDING,
        nullable: false
    })
    Status_activity: ActivityStatus;

    @Column({ nullable: false })
    Approach: TypeApproach;

    @Column({ nullable: true })
    Spaces: number    //cantidad de espacios es opcional porque no todo es limitado  pueden haber casos

    @Column({ type: 'varchar' })
    Location: string;

    @Column()
    Aim: string      //objetivo de la actividad a lograr

    @Column()
    Metric_activity: MetricType;

    @Column({ type: 'int', default: 0 })
    Metric_value: number;

    @Column()
    Active: boolean;

    @Column({ length: 500, nullable: true })
    url?: string;

    @ManyToOne(() => Project, (project) => project.activity, { nullable: false })
    @JoinColumn({ name: 'Id_project' })
    project: Project;

    @OneToMany(() => DateActivity, (dateActivities) => dateActivities.activity)
    dateActivities: DateActivity[];
}
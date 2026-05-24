import {
    Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne,
    OneToMany,
    PrimaryGeneratedColumn, UpdateDateColumn
} from "typeorm";
import { Project } from "./project.entity";
import { ActivityStatus, MetricType, TypeActivity, TypeApproach, TypeFavorite } from "../enums/activity.enum";
import { DateActivity } from "src/modules/projects/entities/date.entity";
import { Activity_enrollment } from "src/modules/volunteers/entities/enrollmentActivity.entity";
import { Metric_value } from "./activityValues.entity";
@Index(['Name', 'Registration_date'], { unique: true })
@Entity()

export class Activity {
    @PrimaryGeneratedColumn()
    Id_activity: number;

    @Column({ type: 'varchar' })
    Name: string

    @Column({ type: 'varchar', nullable: true })
    Slug: string;

    @Column({ type: 'varchar' })
    Description: string;

    @Column({ type: 'varchar', length: 450 })
    Conditions: string;

    @Column({ type: 'varchar', length: 450 })
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

    @Column({ type: 'varchar', length: 350 })
    Aim: string

    @Column()
    Metric_activity: MetricType;

    @Column({ type: 'int', default: 0 })
    Total_metric_value: number;

    @Column()
    Active: boolean;

    @Column({ length: 500, nullable: true })
    url1?: string;

    @Column({ length: 500, nullable: true })
    url2?: string;

    @Column({ length: 500, nullable: true })
    url3?: string;

    @ManyToOne(() => Project, (project) => project.activity, { nullable: false })
    @JoinColumn({ name: 'Id_project' })
    project: Project;

    @OneToMany(() => DateActivity, (dateActivities) => dateActivities.activity)
    dateActivities: DateActivity[];

    @OneToMany(() => Metric_value, (metric_value) => metric_value.activity)
    metric_value: Metric_value[];

    @OneToMany(() => Activity_enrollment, (enrollment) => enrollment.activity, { nullable: true })
    volunteer_enrollments?: Activity_enrollment[];

    @Column({ type: 'int', default: 0 })
    Enrolled_count: number;  // Contador de inscritos actuales

    // Campo calculado (opcional, para facilitar consultas)
    @Column({ type: 'int', nullable: true })
    Available_spaces?: number;  // Espacios disponibles = Spaces - Enrolled_count
}
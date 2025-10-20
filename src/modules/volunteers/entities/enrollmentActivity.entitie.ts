import { Column, PrimaryGeneratedColumn, Entity, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from "typeorm";
import { EnrollmentActivityStatus } from "../enums/enrollmentActivity.enum";
import { Volunteer } from "./volunteer.entitie";
import { Activity } from "src/modules/projects/entities/activity.entity";

@Entity('activity_enrollment')
export class Activity_enrollment {

    @PrimaryGeneratedColumn()
    id_enrollment_activity: number;

    @Column({ nullable: true })
    id_volunteer: number;

    @Column({ nullable: true })
    id_activity: number;

    @CreateDateColumn()
    enrollment_date: Date;

    @Column({
        type: 'enum',
        enum: EnrollmentActivityStatus,
        default: EnrollmentActivityStatus.ENROLLED
    })
    status: EnrollmentActivityStatus;

    @Column({ type: 'timestamp', nullable: true })
    attendance_date: Date;

    @Column({ type: 'text', nullable: true })
    notes: string;

    @UpdateDateColumn()
    updated_at: Date;

    @ManyToOne(() => Volunteer, volunteer => volunteer.activity_enrollments, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'id_volunteer' })
    volunteer: Volunteer;

    @ManyToOne(() => Activity, activity => activity.volunteer_enrollments, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'id_activity' })
    activity: Activity;
}

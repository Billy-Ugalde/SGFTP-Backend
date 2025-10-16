import { Column, PrimaryGeneratedColumn, Entity, ManyToOne, JoinColumn, OneToOne, CreateDateColumn, OneToMany } from "typeorm";
import { EnrollmentActivityStatus } from "../enums/enrollmentActivity.enum";


@Entity()
export class Activity_enrollment {

    @PrimaryGeneratedColumn()
    id_enrrolment_activity: number

    @CreateDateColumn()
    registration_date: Date;

    @Column({
        type: 'enum',
        enum: EnrollmentActivityStatus,
        default: EnrollmentActivityStatus.PENDING
    })
    status: EnrollmentActivityStatus;

}
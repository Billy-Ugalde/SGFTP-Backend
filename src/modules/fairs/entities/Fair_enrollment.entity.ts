import { Column, PrimaryGeneratedColumn, Entity, ManyToOne, JoinColumn, OneToOne, CreateDateColumn, OneToMany } from "typeorm";
import { Fair } from "./fair.entity";
import { Stand } from "./stand.entity";
import { Entrepreneur } from "src/modules/entrepreneurs/entities/entrepreneur.entitie";

export enum EnrollmentStatus {
    PENDING = 'pending',
    APPROVED = 'approved',
    REJECTED = 'rejected'
}
@Entity()
export class Fair_enrollment {

    @PrimaryGeneratedColumn()
    id_enrrolment_fair: number

    @CreateDateColumn()
    registration_date: Date;

    @Column({
        type: 'enum',
        enum: EnrollmentStatus,
        default: EnrollmentStatus.PENDING
    })
    status: EnrollmentStatus;

    @ManyToOne(() => Fair, (fair) => fair.enrollments, { nullable: false })
    @JoinColumn({ name: 'id_fair' })
    fair: Fair;

    @ManyToOne(() => Stand, (stand) => stand.enrollment, { nullable: false })
    @JoinColumn({ name: 'id_stand' })
    stand: Stand

    @ManyToOne(() => Entrepreneur, (entrepreneur) => entrepreneur.enrollment, { nullable: false })
    @JoinColumn({ name: 'id_entrepreneur' })
    entrepreneur: Entrepreneur
}
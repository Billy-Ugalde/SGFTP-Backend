import { Column, PrimaryGeneratedColumn, Entity, ManyToOne, JoinColumn, OneToOne } from "typeorm";
import { Fair } from "./fair.entity";
import { Stand } from "./stand.entity";
import { Entrepreneur } from "src/modules/entrepreneurs/entities/entrepreneur.entitie";
@Entity()
export class Fair_enrollment {

    @PrimaryGeneratedColumn()
    id_enrrolment_fair: number

    @Column({ type: 'datetime' })
    date: Date;

    @Column({ type: 'boolean' })
    status: boolean;

    @ManyToOne(() => Fair, (fair) => fair.enrollments, { nullable: false })
    @JoinColumn({ name: 'id_fair' })
    fair: Fair;

    @OneToOne(() => Stand, (stand) => stand.enrollment, { nullable: false })
    @JoinColumn({ name: 'id_stand' })
    stand: Stand

    @ManyToOne(() => Entrepreneur, (entrepreneur) => entrepreneur.enrollment, { nullable: false })
    @JoinColumn({ name: 'id_entreprenuer' })
    entreprenuer: Entrepreneur
}
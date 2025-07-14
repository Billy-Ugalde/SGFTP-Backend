import { Column, PrimaryGeneratedColumn, ManyToOne, Entity } from "typeorm";


@Entity('fair_enrollment')
export class Fair_enrollment {

    @PrimaryGeneratedColumn()
    id_enrrolment_fair: number

    @Column({ type: 'datetime' })
    assigned_date: Date;

    @Column({ type: 'boolean' })
    status: boolean;
}
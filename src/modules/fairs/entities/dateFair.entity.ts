import { Column, PrimaryGeneratedColumn, Entity, ManyToOne, JoinColumn, OneToOne } from "typeorm";
import { Fair } from "./fair.entity";

@Entity()
export class DateFair {

    @PrimaryGeneratedColumn()
    id_date: number

    @ManyToOne(() => Fair, (fair) => fair.datefairs, { nullable: false })
    @JoinColumn({ name: 'id_fair' })
    fair: Fair;

    @Column()
    date: Date
}
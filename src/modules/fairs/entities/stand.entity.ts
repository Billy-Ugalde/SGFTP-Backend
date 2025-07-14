import { Column, Entity, JoinColumn, ManyToOne, OneToOne, PrimaryGeneratedColumn } from "typeorm";
import { Fair } from "./fair.entity";
import { Entreprenuer } from "src/modules/entrepreneurs/entities/entrepreneur.entitie";
import { Fair_enrollment } from "./Fair_enrollment.entity";

@Entity('stand')
export class Stand {
    @PrimaryGeneratedColumn()
    id_stand: number;

    @Column({ type: 'date' })
    assigned_date: Date;

    @Column({ type: 'integer' })
    stand_number: number;

    @Column({ type: 'boolean' })
    status: boolean;

   
    @ManyToOne(() => Fair, (fair) => fair.stands, { nullable: false })
    @JoinColumn({ name: 'id_fair' }) // Esto define el nombre de la columna FK  y la referencia 
    fair: Fair;

    @OneToOne(() => Entreprenuer, (entreprenuer) => entreprenuer.stand, { nullable: false })
    @JoinColumn({ name: 'id_entreprenuer' })
    entreprenuer: Entreprenuer;


    @OneToOne(()=>Fair_enrollment, (fair_enrollment)=>fair_enrollment.stand)
    enrollment: Fair_enrollment;
}
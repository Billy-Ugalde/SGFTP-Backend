import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Fair } from "./fair.entity";

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

    // Relación Many-to-One con Fair
    @ManyToOne(() => Fair, (fair) => fair.stands,{ nullable: false })
    @JoinColumn({ name: 'id_fair' }) // Esto define el nombre de la columna FK  y la referencia 
    fair: Fair;
}
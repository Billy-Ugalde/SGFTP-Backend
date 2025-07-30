import { Column, Entity, JoinColumn, ManyToOne, OneToOne, PrimaryGeneratedColumn } from "typeorm";
import { Fair } from "./fair.entity";
import { Entreprenuer } from "src/modules/entrepreneurs/entities/entrepreneur.entity";
import { Fair_enrollment } from "./Fair_enrollment.entity";

@Entity()
export class Stand {
    @PrimaryGeneratedColumn()
    id_stand: number;

    @Column({ type: 'date', nullable: false })
    assigned_date: Date;

    @Column({ type: 'varchar' })
    stand_code: string;

    @Column({ type: 'boolean' })
    status: boolean;

    @ManyToOne(() => Fair, (fair) => fair.stands, { nullable: false })
    @JoinColumn({ name: 'id_fair' }) // Esto define el nombre de la columna FK  
    fair: Fair;

    @OneToOne(() => Entreprenuer, (entreprenuer) => entreprenuer.stand, { nullable: true })
    @JoinColumn({ name: 'id_entreprenuer' })
    entreprenuer?: Entreprenuer;            //nota: es opcional porque hasta que un emprendedor se inscribe obtiene el stand

    @OneToOne(() => Fair_enrollment, (fair_enrollment) => fair_enrollment.stand)
    enrollment: Fair_enrollment;
}
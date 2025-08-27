import { Column, Entity, JoinColumn, ManyToOne, OneToMany, OneToOne, PrimaryGeneratedColumn } from "typeorm";
import { Fair } from "./fair.entity";
import { Entrepreneur } from "src/modules/entrepreneurs/entities/entrepreneur.entitie";
import { Fair_enrollment } from "./Fair_enrollment.entity";
@Entity()
export class Stand {
    @PrimaryGeneratedColumn()
    id_stand: number;

    @Column({ type: 'varchar' })
    stand_code: string;

    @Column({ type: 'boolean' })
    status: boolean;

    @ManyToOne(() => Fair, (fair) => fair.stands, { nullable: false })
    @JoinColumn({ name: 'id_fair' }) // Esto define el nombre de la columna FK  
    fair: Fair;

    @OneToOne(() => Entrepreneur, (entrepreneur) => entrepreneur.stand, {
        nullable: true, 
        eager: true,
    })
    @JoinColumn({ name: 'id_entrepreneur' })
    entrepreneur?: Entrepreneur;            //nota: es opcional porque hasta que un emprendedor se inscribe obtiene el stand

    @OneToMany(() => Fair_enrollment, (fair_enrollment) => fair_enrollment.stand)
    enrollment: Fair_enrollment;
}
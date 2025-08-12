import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { Stand } from "./stand.entity";
import { Fair_enrollment } from "./Fair_enrollment.entity";
import { DateFair } from "./dateFair.entity";
@Entity()
export class Fair {
    @PrimaryGeneratedColumn()
    id_fair: number;

    @Column({ type: 'varchar', length: 50 })
    name: string;

    @Column({ type: 'text' })
    description: string;

    @Column({ type: 'varchar', length: 150 })
    location: string;

    @Column({ type: 'integer' })
    stand_capacity: number;

    @Column({ default: true })
    status: boolean;

    @OneToMany(() => Stand, (stand) => stand.fair)
    stands: Stand[];

    @OneToMany(() => DateFair, (datefair) => datefair.fair, {
        cascade: ['insert'],  eager: true,   //nota: eager es para que jale las fechas de lado del muchos
    })
    datefairs: DateFair[];

    @OneToMany(() => Fair_enrollment, (enrollment) => enrollment.fair)
    enrollments: Fair_enrollment[];
}
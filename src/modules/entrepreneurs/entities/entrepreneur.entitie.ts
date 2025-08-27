import { Person } from "src/entities/person.entity";
import { Fair_enrollment } from "src/modules/fairs/entities/Fair_enrollment.entity";
import { Stand } from "src/modules/fairs/entities/stand.entity";
import { Column, PrimaryGeneratedColumn, OneToOne, OneToMany, Entity, JoinColumn } from "typeorm";

@Entity()
export class Entrepreneur {

    @PrimaryGeneratedColumn()
    id_entrepreneur: number

    @Column({ type: 'date' })
    registration_date: Date;

    @Column({ type: 'float' })
    experience: number;

    @OneToOne(() => Stand, (stand) => stand.entrepreneur)
    stand: Stand;

    @OneToMany(() => Fair_enrollment, (fairController) => fairController.entrepreneur)
    enrollment: Fair_enrollment;

    @OneToOne(() => Person, (person) => person.entrepreneur, { nullable: false })
    @JoinColumn({ name: 'id_person' })
    person: Person;

}
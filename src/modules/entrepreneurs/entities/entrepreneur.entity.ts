import { Person } from "src/entities/person.entity";
import { Fair_enrollment } from "src/modules/fairs/entities/Fair_enrollment.entity";
import { Stand } from "src/modules/fairs/entities/stand.entity";
<<<<<<< HEAD
import { Column, PrimaryGeneratedColumn, OneToOne, OneToMany, Entity, JoinColumn } from "typeorm";

@Entity()
export class Entreprenuer {

    @PrimaryGeneratedColumn()
    id_entreprenuer: number

    @Column({ type: 'date' })
    registration_date: Date;

    @Column({ type: 'float' })
    experience: number;

    @OneToOne(() => Stand, (stand) => stand.entreprenuer)
    stand: Stand;

    @OneToMany(() => Fair_enrollment, (fairController) => fairController.entreprenuer)
    enrollment: Fair_enrollment;

    @OneToOne(() => Person, (person) => person.entrepreneur, { nullable: false })
    @JoinColumn({ name: 'id_person' })
    person: Person;

=======
import { Column, PrimaryGeneratedColumn, OneToOne, OneToMany, Entity, JoinColumn, CreateDateColumn, UpdateDateColumn } from "typeorm";
import { Entrepreneurship } from './entrepreneurship.entity';

export enum EntrepreneurStatus {
    PENDING = 'pending',
    APPROVED = 'approved',
    REJECTED = 'rejected'
}


@Entity('entrepreneurs')
export class Entrepreneur {

    @PrimaryGeneratedColumn()
    id_entrepreneur: number;

    @Column({ nullable: true })
    id_person: number;

    @Column({ type: 'int', nullable: false })
    experience: number;

    @Column({
        type: 'enum',
        enum: EntrepreneurStatus,
        default: EntrepreneurStatus.PENDING
    })
    status: EntrepreneurStatus;

    @Column({ type: 'boolean', default: true })
    is_active: boolean;

    @Column({ length: 500, nullable: true })
    facebook_url?: string;

    @Column({ length: 500, nullable: true })
    instagram_url?: string;

    @CreateDateColumn()
    registration_date: Date;

    @UpdateDateColumn()
    updated_at: Date;

    @OneToOne(() => Person, person => person.entrepreneur, {
        cascade: true,
        eager: true,
        onDelete: 'CASCADE'
    })
    @JoinColumn({ name: 'id_person' })
    person: Person;

    @OneToOne(() => Entrepreneurship, entrepreneurship => entrepreneurship.entrepreneur, {
        cascade: true,
        eager: true,
        onDelete: 'CASCADE'
    })
    entrepreneurship: Entrepreneurship;

    @OneToMany(() => Stand, (stand) => stand.entrepreneur)
    stand: Stand[];

    @OneToMany(() => Fair_enrollment, (fairController) => fairController.entrepreneur)
    enrollment: Fair_enrollment;

>>>>>>> origin/development
}
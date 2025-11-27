import { Person } from "src/entities/person.entity";
import { Column, PrimaryGeneratedColumn, OneToOne, OneToMany, Entity, JoinColumn, CreateDateColumn, UpdateDateColumn } from "typeorm";
import { Activity_enrollment } from "./enrollmentActivity.entity";
import { Mailbox } from "./mailbox.entity";

@Entity('volunteers')
export class Volunteer {

    @PrimaryGeneratedColumn()
    id_volunteer: number;

    @Column({ type: 'boolean', default: true })
    is_active: boolean;

    @CreateDateColumn()
    registration_date: Date;

    @UpdateDateColumn()
    updated_at: Date;

    @OneToOne(() => Person, person => person.volunteer, {
        nullable: false,
        onDelete: 'CASCADE'
    })
    @JoinColumn({ name: 'id_person' })
    person: Person;

    @OneToMany(() => Activity_enrollment, enrollment => enrollment.volunteer)
    activity_enrollments: Activity_enrollment[];

    @OneToMany(() => Mailbox, (mailbox) => mailbox.volunteer)
    mailboxes: Mailbox[];
}

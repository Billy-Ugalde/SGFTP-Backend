import {
    Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne,
    PrimaryGeneratedColumn, UpdateDateColumn
} from "typeorm";
import { Volunteer } from "./volunteer.entity";

@Index(['Affair', 'Registration_date'], { unique: true })
@Entity()

export class Mailbox {
    @PrimaryGeneratedColumn()
    Id_mailbox: number;

    @Column({ type: 'varchar' })
    Organization: string

    @Column({ type: 'varchar' })
    Description: string;

    @Column({ type: 'varchar' })
    Affair: string;  

    @CreateDateColumn()
    Registration_date: Date;

    @UpdateDateColumn()
    Update_date: Date;

    @Column({ type: 'int', default: 0 })
    Hour_volunteer: number;

    @Column({ length: 500, nullable: true })
    Document1: string;

    @Column({ length: 500, nullable: true })
    Document2?: string;

    @Column({ length: 500, nullable: true })
    Document3?: string;

    @ManyToOne(() => Volunteer, (volunteer) => volunteer.mailboxes)
    @JoinColumn({ name: 'id_volunteer' })
    volunteer: Volunteer;
}

import {
    Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne,
    OneToMany,
    PrimaryGeneratedColumn, UpdateDateColumn
} from "typeorm";


@Index(['Name', 'Registration_date'], { unique: true })
@Entity()

export class Mailbox {
    @PrimaryGeneratedColumn()
    Id_mailbox: number;

    @Column({ type: 'varchar' })
    Name: string

    @Column({ type: 'varchar' })
    Description: string;

    @Column({ type: 'varchar' })
    affair: string;  //asunto

    @CreateDateColumn()
    registration_date: Date;

    @Column({ type: 'int', default: 0 })
    hour_volunteer: number;

    @Column({ length: 500, nullable: true })
    document1?: string;

    @Column({ length: 500, nullable: true })
    document2?: string;

    @Column({ length: 500, nullable: true })
    document3?: string;

}
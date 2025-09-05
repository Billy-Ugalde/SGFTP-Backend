import { Person } from "src/entities/person.entity";
import { Column, Entity, JoinColumn, ManyToOne, OneToOne, PrimaryGeneratedColumn } from "typeorm";
import { Role } from "./role.entity";

@Entity()

export class User {
    @PrimaryGeneratedColumn()
    id_user: number;

    @Column({ type: 'varchar', length: 50 })
    password: string;

    @Column({ type: 'boolean', length: 50 })
    status: boolean;

    @OneToOne(() => Person, (person) => person.user, {
        nullable: false,
        eager: true,
    })
    @JoinColumn({ name: 'id_person' })
    person: Person;

    @ManyToOne(() => Role, (role) => role.user, {
        nullable: false,
        eager: true,
    })
    @JoinColumn({ name: 'id_role' })
    role: Role;
}
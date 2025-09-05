import { Person } from "src/entities/person.entity";
import { Column, Entity, JoinColumn, ManyToOne, OneToOne, PrimaryGeneratedColumn } from "typeorm";
import { Role } from "./role.entity";

@Entity()

export class User {
    @PrimaryGeneratedColumn()
    id_user: number;

    @Column({ type: 'text', select: false }) // Nunca retornar el password en consultas
    password: string;

    @Column({ default: true })
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

    // Helper method para auth
    get email(): string {
        return this.person.email;
    }

    @Column({ type: 'boolean', default: false })
    isEmailVerified: boolean;

    @Column({ type: 'int', default: 0 })
    failedLoginAttempts: number;

    @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    createdAt: Date;

    toJwtPayload(): { sub: string; email: string; role: string } {
    return {
        sub: this.id_user.toString(),
        email: this.person?.email || '',
        role: this.role?.name || '',
    };
}
}
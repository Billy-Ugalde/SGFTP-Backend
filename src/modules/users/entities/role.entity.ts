import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { User } from "./user.entity";

@Entity()

export class Role {
    @PrimaryGeneratedColumn()
    id_role: number;

    @Column({ type: 'varchar', length: 50 })
    name: string;

    @OneToMany(() => User, (user) => user.role, {
        nullable: true,
    })
    user: User[];
}
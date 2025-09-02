import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { User } from "../entities/user.entity";
import { Repository } from "typeorm";
import { Role } from "../entities/role.entity";
import { CreateUserDto } from "../dto/user.dto";
import { Person } from "src/entities/person.entity";


@Injectable()
export class UserService {
    constructor(
        @InjectRepository(User)
        private userRepository: Repository<User>,
    ) { }

    async create(createUserDto: CreateUserDto) {
        const user = this.userRepository.create({
            password: createUserDto.password,
            person: { id_person: createUserDto.id_person } as Person, 
            role: { id_role: createUserDto.id_role } as Role,     
        });

        return this.userRepository.save(user);
    }

    async findAll(): Promise<User[]> {
        return this.userRepository.find({ relations: ['role', 'person'] });
    }

    async findOne(id: number): Promise<User> {
        const user = await this.userRepository.findOne({
            where: { id_user: id },
            relations: ['role', 'person'],
        });
        if (!user) throw new NotFoundException('Usuario no encontrado');
        return user;
    }
}
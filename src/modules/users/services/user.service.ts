import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { User } from "../entities/user.entity";
import { Repository } from "typeorm";
import { Role } from "../entities/role.entity";
import { CreateUserDto } from "../dto/user.dto";
import { Person } from "src/entities/person.entity";
import { UpdateUserDto } from "../dto/userUpdateDto";

@Injectable()
export class UserService {
    constructor(
        @InjectRepository(User)
        private userRepository: Repository<User>,
        @InjectRepository(Person)
        private personRepository: Repository<Person>,

        @InjectRepository(Role)
        private roleRepository: Repository<Role>
    ) { }
    async create(createUserDto: CreateUserDto) {
        const person = await this.personRepository.findOne({
            where: { id_person: createUserDto.id_person },
            relations: ['user']
        });

        if (!person) {
            throw new NotFoundException('La persona especificada no existe');
        }

        if (person.user) {
            throw new ConflictException('Esta persona ya tiene un usuario asociado');
        }

        const role = await this.roleRepository.findOne({
            where: { id_role: createUserDto.id_role }
        });

        if (!role) {
            throw new NotFoundException('El rol especificado no existe');
        }

        const user = this.userRepository.create({
            password: createUserDto.password,
            status: createUserDto.status ?? true,
            person: { id_person: createUserDto.id_person } as Person,
            role: { id_role: createUserDto.id_role } as Role,
        });

        return this.userRepository.save(user);
    }

    async findAll(): Promise<User[]> {
        return this.userRepository.find({ relations: ['role', 'person'] });
    }

    async update(id: number, updateUserDto: UpdateUserDto) {
        const user = await this.findOne(id);

        if (updateUserDto.password) {
        }
        if (updateUserDto.id_role && updateUserDto.id_role !== user.role.id_role) {
            const role = await this.roleRepository.findOne({
                where: { id_role: updateUserDto.id_role }
            });

            if (!role) {
                throw new NotFoundException('El rol especificado no existe');
            }
        }

        const { id_role, ...dataWithoutIdRole } = updateUserDto;
        const updateData: any = { ...dataWithoutIdRole };

        if (id_role) {
            updateData.role = { id_role: id_role };
        }

        await this.userRepository.update(id, updateData);
        return this.findOne(id);
    }

    async updateStatus(id_user: number, updateStatus: UpdateUserDto) {
        const user = await this.userRepository.findOne({ where: { id_user } });

        if (!user) {
            throw (`El usuario con el id ${id_user} no fue encontrado`);
        }
        await this.userRepository.update(id_user, updateStatus);
        return this.findOne(id_user);
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
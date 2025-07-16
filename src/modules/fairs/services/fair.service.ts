import { Injectable } from "@nestjs/common";
import { Fair } from "../entities/fair.entity";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { fairDto } from "../dto/createFair.dto";
import { UpdatefairDto } from "../dto/updateFair.dto";
@Injectable()
export class FairService {
    constructor(
        @InjectRepository(Fair)
        private fairRepository: Repository<Fair>
    ) { }

    async create(createfairDto: fairDto) {
        const newfair = this.fairRepository.create(createfairDto)
        return await this.fairRepository.save(newfair);
    }

    async getAll() {
        return await this.fairRepository.find();
    }

    async getOne(id_fair: number): Promise<Fair> {
        const fair = await this.fairRepository.findOne({ where: { id_fair } });

        if (!fair) {
            throw (`La feria con el id ${id_fair} no encontrada`);
        }
        return fair;
    }

    async update(id_fair: number, updateFair: UpdatefairDto) {
        await this.fairRepository.update({ id_fair }, updateFair);
        return this.getOne(id_fair);
    }

    async updateStatus(id_fair: number, status: boolean) {
        await this.fairRepository.update({ id_fair }, { status });
        return this.getOne(id_fair);
    }
}
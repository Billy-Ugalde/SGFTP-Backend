import { Injectable } from "@nestjs/common";
import { Fair } from "../entities/fair.entity";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { fairDto } from "../dto/createFair.dto";
import { UpdatefairDto } from "../dto/updateFair.dto";
import { fairStatusDto } from "../dto/fair-status.dto";
import { StandService } from "./stand.service";

@Injectable()
export class FairService {
    constructor(
        @InjectRepository(Fair)
        private fairRepository: Repository<Fair>,
        private standService: StandService
    ) { }

    async create(createfairDto: fairDto) {
        const newfair = this.fairRepository.create({
            ...createfairDto,
            date: new Date(createfairDto.date) // Convierte el stirng al tipo de dato date antes de enviar a la base de datos
        });
        const savedfair = await this.fairRepository.save(newfair);

        await this.standService.createInitialStands(savedfair.id_fair, savedfair.stand_capacity);
        return savedfair;
    }

    async getAll() {
        return await this.fairRepository.find();
    }

    async getOne(id_fair: number): Promise<Fair> {
        const fair = await this.fairRepository.findOne({ where: { id_fair } });

        if (!fair) {
            throw (`La feria con el id ${id_fair} no fue encontrada`);
        }
        return fair;
    }

    async update(id_fair: number, updateFair: UpdatefairDto) {
        await this.fairRepository.update({ id_fair }, updateFair);
        if (updateFair.stand_capacity !== undefined) {
            await this.standService.adjustStandsToCapacity(id_fair, updateFair.stand_capacity);
        }
        return this.getOne(id_fair);
    }

    async updateStatus(id_fair: number, fairStatus: fairStatusDto) {
        await this.fairRepository.update(id_fair, fairStatus);
        return this.getOne(id_fair);
    }
}
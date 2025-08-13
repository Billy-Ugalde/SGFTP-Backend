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

    async create(createFairDto: fairDto) {
        const { dateFairs, ...fairData } = createFairDto;

        const newFair = this.fairRepository.create({
            ...fairData,
            datefairs: dateFairs.map(d => ({ date: new Date(d) })),
        });

        const savedFair = await this.fairRepository.save(newFair);

        await this.standService.createInitialStands(
            savedFair.id_fair,
            savedFair.stand_capacity,
        );

        return savedFair;
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
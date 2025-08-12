import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { DateFair } from "../entities/dateFair.entity";
import { dateDto } from "../dto/createDate.dto";

@Injectable()
export class DateService {

    constructor(
        @InjectRepository(DateFair)
        private dateRepository: Repository<DateFair>
    ) { }

    async getOne(id_date: number) {
        const date = await this.dateRepository.findOne({ where: { id_date } });

        return date;
    }

    async findByFair(id_fair: number) {
        return this.dateRepository.find({
            where: {
                fair: { id_fair },  //    Nota: esto lo que hace es que filtra por la fk id_fair
            },
            order: { date: 'ASC' },
        });
    }
    async create(id_fair: number, createDate: dateDto) {
        const dateFairs = createDate.dateFairs.map(dateString =>
            this.dateRepository.create({
                date: new Date(dateString),
                fair: { id_fair: id_fair }
            })
        );
        return await this.dateRepository.save(dateFairs);
    }

    async remove(id_date: number) {
        const date = await this.getOne(id_date)

        if (!date) {
            throw (`La fecha con el id ${id_date} no fue encontrada`);
        }
        await this.dateRepository.remove(date);
        return `Fecha con el id: ${id_date} ha sido eliminada`;
    }
}
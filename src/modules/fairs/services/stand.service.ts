import { Injectable } from "@nestjs/common";
import { Stand } from "../entities/stand.entity";
import { Fair } from "../entities/fair.entity";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

@Injectable()
export class StandService {
    constructor(
        @InjectRepository(Stand)
        private standRepository: Repository<Stand>,
        @InjectRepository(Fair)
        private fairRepository: Repository<Fair>
    ) { }

    async createInitialStands(fairId: number, capacity: number) {
        const fair = await this.fairRepository.findOne({ where: { id_fair: fairId } });
        if (!fair) {
            throw new Error(`Feria con ID ${fairId} no encontrada`);
        }
        const standsToCreate: Partial<Stand>[] = [];     //nota: se le pone Partial para decir que el objeto no va completo
        for (let position = 0; position < capacity; position++) {
            standsToCreate.push({
                stand_code: this.generateCode(position),
                assigned_date: new Date(),
                status: false,
                fair: fair
            });
        }
        return await this.standRepository.save(standsToCreate);
    }

    async adjustStandsToCapacity(fairId: number, newCapacity: number) {
        const fair = await this.fairRepository.findOne({ where: { id_fair: fairId } });
        if (!fair) {
            throw new Error(`Feria con ID ${fairId} no encontrada`);
        }
        const currentStands = await this.getStandsByFair(fairId);
        const currentCount = currentStands.length;
        if (newCapacity > currentCount) {
            await this.createAdditionalStands(fair, currentCount, newCapacity);
        } else if (newCapacity < currentCount) {
            await this.removeStands(currentStands, newCapacity);
        }
    }

    //nota: la siguiente funcion añade más stands apartir de la posicion actual y hacia la cantidad a modificar
    private async createAdditionalStands(fair: Fair, fromPosition: number, toPosition: number) {
        const standsToCreate: Partial<Stand>[] = [];
        for (let position = fromPosition; position < toPosition; position++) {
            standsToCreate.push({
                stand_code: this.generateCode(position),
                assigned_date: new Date(),
                status: false,
                fair: fair
            });
        }
        await this.standRepository.save(standsToCreate);  //aquí se guarda la adicion de los stands
    }

    private async removeStands(stands: Stand[], newCapacity: number) {
        const standsToRemove = stands.slice(newCapacity);  //nota la funcion slice trabaja con indices, por ejemplo si es una lista de 10 y el parametro es 5, despues de 5 son los stands a eliminar.
        const occupiedStands = standsToRemove.filter(stand => stand.status); //validacion para  ver si estuviera ocupado

        if (occupiedStands.length > 0) {
            const codes = occupiedStands.map(s => s.stand_code).join(', '); //obtiene los id de los ocupados y lo convierte en un string separado por comas ejemplos "A07, A09"
            throw new Error(`No se puede reducir la capacidad, porque los siguientes stands estan ocupados: ${codes}`);
        }
        const standIds = standsToRemove.map(s => s.id_stand);  //obtiene los id  a remover
        await this.standRepository.delete(standIds);
    }

    private generateCode(position: number): string {
        const letter = String.fromCharCode(65 + Math.floor(position / 10)); //nota: funcion fromCharCode() convierte en codigo ASCII  ejemplo 65 es la letra 'A'
        const number = (position % 10) + 1;   //nota el  +1 es para que vaya del 1 al 10 y no del 0 al 9
        return `${letter}${number.toString().padStart(2, '0')}`;  //para que siempre sea  de dos digitos  por ejemmplo 01, 02
    }

    async getStandsByFair(fairId: number): Promise<Stand[]> {  //obtiene los stands por id de feria
        return this.standRepository.find({
            where: { fair: { id_fair: fairId } },
            order: { stand_code: 'ASC' }  //nota: esto es para que se ordenen en modo ascendente
        });
    }
    
    async getAllStandsOrdered(): Promise<Stand[]> { //obtiene todos los stands con sus respectivas ferias
        return this.standRepository.find({
            order: {
                fair: { id_fair: 'ASC' },
                stand_code: 'ASC'
            },
            relations: ['fair']
        });
    }
}
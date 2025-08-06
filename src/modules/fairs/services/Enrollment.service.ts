import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Fair_enrollment } from "../entities/Fair_enrollment.entity";
import { EnrollmentFairDto } from "../dto/enrrolmentFair.dto";

@Injectable()
export class EnrrolmentService {
    constructor(
        @InjectRepository(Fair_enrollment)
        private fairRepository: Repository<Fair_enrollment>
    ) { }


    async create(createEnrrolment: EnrollmentFairDto) {


    }

}
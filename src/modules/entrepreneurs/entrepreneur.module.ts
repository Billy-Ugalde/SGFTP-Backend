import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
<<<<<<< HEAD
import {EntreprenuerController} from "./controllers/entreprenuer.controller"
import { Entreprenuer } from "./entities/entrepreneur.entity";
import { EntrepreneurService } from "./services/entrepreneur.service.service";
=======
import { EntrepreneurController } from "./controllers/entreprenuer.controller";
import { Entrepreneur } from "./entities/entrepreneur.entity";
import { Entrepreneurship } from './entities/entrepreneurship.entity';
>>>>>>> origin/development
import { Person } from "src/entities/person.entity";
import { Phone } from "src/entities/phone.entity";
import { EntrepreneurService } from "./services/entrepreneur.service";
import { PersonService } from "./services/person.service";
import { EntrepreneurshipService } from "./services/entrepreneurship.service";
import { PhoneService } from "./services/phone.service";

@Module({
    imports: [
        TypeOrmModule.forFeature([
            Entrepreneur, 
            Entrepreneurship, 
            Person, 
            Phone
        ])
    ],
    controllers: [EntrepreneurController],
    providers: [
        EntrepreneurService,
        PersonService,
        EntrepreneurshipService,
        PhoneService
    ]
})
export class EntrepreneurModule { }
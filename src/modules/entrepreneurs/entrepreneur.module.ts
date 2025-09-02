import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { EntrepreneurController } from "./controllers/entreprenuer.controller";
import { Entrepreneur } from "./entities/entrepreneur.entity";
import { Entrepreneurship } from './entities/entrepreneurship.entity';
import { EntrepreneurService } from "./services/entrepreneur.service";
import { EntrepreneurshipService } from "./services/entrepreneurship.service";
import { PersonModule } from "../person/person.module";

@Module({
    imports: [
        TypeOrmModule.forFeature([
            Entrepreneur, 
            Entrepreneurship, 
        ]),
        PersonModule
    ],
    controllers: [EntrepreneurController],
    providers: [
        EntrepreneurService,
        EntrepreneurshipService,
    ]
})
export class EntrepreneurModule { }
import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import {EntrepreneurController} from "./controllers/entreprenuer.controller"
import { Entrepreneur } from "./entities/entrepreneur.entity";
import { EntrepreneurService } from "./services/entrepreneur.service.service";
import { Person } from "src/entities/person.entity";

@Module({
    imports: [TypeOrmModule.forFeature([Entrepreneur, Person])],
    controllers: [EntrepreneurController],
    providers: [ EntrepreneurService]

})
export class EntrepreneurModule { }
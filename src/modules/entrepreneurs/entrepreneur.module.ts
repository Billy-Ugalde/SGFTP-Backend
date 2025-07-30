import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import {EntreprenuerController} from "./controllers/entreprenuer.controller"
import { Entreprenuer } from "./entities/entrepreneur.entity";
import { EntrepreneurService } from "./services/entrepreneur.service.service";
import { Person } from "src/entities/person.entity";

@Module({
    imports: [TypeOrmModule.forFeature([Entreprenuer, Person])],
    controllers: [EntreprenuerController],
    providers: [ EntrepreneurService]

})
export class EntreprenuerModule { }
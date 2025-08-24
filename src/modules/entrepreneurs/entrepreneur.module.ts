import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import {EntrepreneurController} from "./controllers/entreprenuer.controller"
import { Entrepreneur } from "./entities/entrepreneur.entity";
import { Entrepreneurship } from './entities/entrepreneurship.entity';
import { EntrepreneurService } from "./services/entrepreneur.service";
import { Person } from "src/entities/person.entity";

@Module({
    imports: [TypeOrmModule.forFeature([Entrepreneur, Entrepreneurship, Person])],
    controllers: [EntrepreneurController],
    providers: [ EntrepreneurService]

})
export class EntrepreneurModule { }
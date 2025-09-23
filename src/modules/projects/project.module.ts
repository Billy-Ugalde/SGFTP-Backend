import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ProjectService } from "./services/project.service";
import { Project } from "./entities/project.entity";
import { Campaign } from "./entities/campaign.entity";
import { ProjectController } from "./controllers/project.controller";

@Module({
    imports: [TypeOrmModule.forFeature([Project, Campaign]),],
    controllers: [ProjectController],
    providers: [ProjectService]
})
export class ProjectModule { }
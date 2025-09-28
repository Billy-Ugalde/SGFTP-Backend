import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ProjectService } from "./services/project.service";
import { Project } from "./entities/project.entity";
import { Activity } from "./entities/activity.entity";
import { ProjectController } from "./controllers/project.controller";
import { DateActivity } from "./entities/date.entity";

@Module({
    imports: [TypeOrmModule.forFeature([Project, Activity, DateActivity]),],
    controllers: [ProjectController],
    providers: [ProjectService]
})
export class ProjectModule { }
import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ProjectService } from "./services/project.service";
import { Project } from "./entities/project.entity";
import { Activity } from "./entities/activity.entity";
import { ProjectController } from "./controllers/project.controller";
import { DateActivity } from "./entities/date.entity";
import { GoogleDriveService } from "../google-drive/google-drive.service";
import { ActivityController } from "./controllers/activity.controller";
import { ActivityService } from "./services/activity.service";

@Module({
    imports: [TypeOrmModule.forFeature([Project, Activity, DateActivity]),],
    controllers: [ProjectController, ActivityController],
    providers: [ProjectService, ActivityService, GoogleDriveService,]
})
export class ProjectModule { }
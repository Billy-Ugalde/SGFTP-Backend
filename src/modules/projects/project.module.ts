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
import { ReportProjectController } from "./controllers/reportProject.controller";
import { ReportProjectService } from "./services/reportProject.service";

@Module({
    imports: [TypeOrmModule.forFeature([Project, Activity, DateActivity]),],
    controllers: [ProjectController, ActivityController, ReportProjectController],
    providers: [ProjectService, ActivityService, GoogleDriveService, ReportProjectService]
})
export class ProjectModule { }
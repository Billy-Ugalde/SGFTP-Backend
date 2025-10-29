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
import { ReportActivityService } from "./services/reportActivity.service";
import { Metric_value } from "./entities/activityValues.entity";
import { AuthModule } from "../auth/auth.module";
import { Activity_enrollment } from "../volunteers/entities/enrollmentActivity.entity";

@Module({
    imports: [TypeOrmModule.forFeature([Project, Activity, DateActivity, Metric_value, Activity_enrollment]), AuthModule],
    controllers: [ProjectController, ActivityController, ReportProjectController, ActivityController],
    providers: [ProjectService, ActivityService, GoogleDriveService, ReportProjectService, ReportActivityService]
})
export class ProjectModule { }
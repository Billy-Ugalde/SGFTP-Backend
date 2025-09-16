import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Fair } from "./entities/fair.entity";
import { FairController } from "./controllers/fair.controller";
import { FairService } from "./services/fair.service"
import { Stand } from "./entities/stand.entity";
import { Fair_enrollment } from "./entities/Fair_enrollment.entity"
import { StandService } from "./services/stand.service";
import { StandController } from "./controllers/stand.controller";
import { EnrollmentController } from "./controllers/enrollment.controller";
import { EnrrolmentService } from "./services/Enrollment.service";
import { Entrepreneur } from "../entrepreneurs/entities/entrepreneur.entity";
import { AuthModule } from "../auth/auth.module";

import { FairReportController } from "./controllers/reports.controller";
import { ReportFairService } from "./services/reportFair.service";
import { FairNotificationService } from "../notifications/services/fair-notification.service";
import { NotificationService } from "../notifications/services/notification.service";
import { User } from "../users/entities/user.entity";
@Module({
    imports: [TypeOrmModule.forFeature([Fair, Stand, Fair_enrollment, Entrepreneur, User]), AuthModule],
    controllers: [FairController, StandController, EnrollmentController, FairReportController],
    providers: [FairService, StandService, EnrrolmentService, ReportFairService, NotificationService, FairNotificationService]

})
export class FairModule { }
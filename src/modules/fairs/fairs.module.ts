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
@Module({
    imports: [TypeOrmModule.forFeature([Fair, Stand, Fair_enrollment,Entrepreneur]), AuthModule],
    controllers: [FairController, StandController, EnrollmentController],
    providers: [FairService, StandService,EnrrolmentService]
})
export class FairModule { }
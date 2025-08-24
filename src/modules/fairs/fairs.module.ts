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
import { DateFair } from "./entities/dateFair.entity";
import { DateService } from "./services/date.service";
import { DateController } from "./controllers/date.controller";
@Module({
    imports: [TypeOrmModule.forFeature([Fair, Stand, Fair_enrollment, DateFair])],
    controllers: [FairController, StandController, DateController],
    providers: [FairService, StandService, DateService]

})
export class FairModule { }
import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Fair } from "./entities/fair.entity";
import { FairController } from "./controllers/fair.controller";
import { FairService } from "./services/fair.service"
import { Stand } from "./entities/stand.entity";
import { Fair_enrollment } from "./entities/Fair_enrollment.entity"
@Module({
    imports: [TypeOrmModule.forFeature([Fair, Stand, Fair_enrollment])],
    controllers: [FairController],
    providers: [FairService]

})
export class FairModule { }
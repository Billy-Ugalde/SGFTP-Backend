import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ContactInfoController } from "./controllers/contact-info.controller";
import { ContentBlockController } from "./controllers/content-block.controller";
import { StatsController } from "./controllers/stats.controller";
import { ContactInfoService } from "./services/contact-info.service";
import { ContentBlockService } from "./services/content-block.service";
import { StatsService } from "./services/stats.service";
import { ContactInfo } from "./entities/contact-info.entity";
import { ContentBlock } from './entities/content-block.entity';
import { InformativeSeedService } from "./services/informative-seed.service";
import { AuthModule } from "../auth/auth.module";
import { GoogleDriveService } from "../google-drive/google-drive.service";
import { ImageProxyController } from "../google-drive/image-proxy.controller";
import { Project } from "../projects/entities/project.entity";
import { Activity } from "../projects/entities/activity.entity";
import { Volunteer } from "../volunteers/entities/volunteer.entity";
import { Donor } from "../donations/entities/donor.entity";
import { User } from "../users/entities/user.entity";
import { Entrepreneur } from "../entrepreneurs/entities/entrepreneur.entity";

@Module({
  imports: [
    TypeOrmModule.forFeature([ContactInfo, ContentBlock, Project, Activity, Volunteer, Donor, User, Entrepreneur]),
    AuthModule
  ],
  controllers: [
    ContactInfoController,
    ContentBlockController,
    StatsController,
    ImageProxyController
  ],
  providers: [
    ContactInfoService,
    ContentBlockService,
    StatsService,
    InformativeSeedService,
    GoogleDriveService
  ],
  exports: [
    ContactInfoService,
    ContentBlockService,
    InformativeSeedService,
  ]
})
export class InformativeModule { }
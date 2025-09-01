import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ContactInfoController } from "./controllers/contact-info.controller";
import { ContentBlockController } from "./controllers/content-block.controller";
import { ContactInfoService } from "./services/contact-info.service";
import { ContentBlockService } from "./services/content-block.service";
import { ContactInfo } from "./entities/contact-info.entity";
import { ContentBlock } from './entities/content-block.entity';
import { SeedService } from "./services/seed.service";

@Module({
  imports: [
    TypeOrmModule.forFeature([ContactInfo, ContentBlock])
  ],
  controllers: [
    ContactInfoController,
    ContentBlockController
  ],
  providers: [
    ContactInfoService,
    ContentBlockService,
    SeedService
  ],
  exports: [
    ContactInfoService,
    ContentBlockService
  ]
})
export class InformativeModule { }
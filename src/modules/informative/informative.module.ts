import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { NewsController } from "./controllers/news.controller";
import { ContactInfoController } from "./controllers/contact-info.controller";
import { ContentBlockController } from "./controllers/content-block.controller";
import { NewsService } from "./services/news.service";
import { ContactInfoService } from "./services/contact-info.service";
import { ContentBlockService } from "./services/content-block.service";
import { News } from "./entities/news.entity";
import { ContactInfo } from "./entities/contact-info.entity";
import { ContentBlock } from './entities/content-block.entity';
import { SeedService } from "./services/seed.service";

@Module({
  imports: [
    TypeOrmModule.forFeature([News, ContactInfo, ContentBlock])
  ],
  controllers: [
    NewsController,
    ContactInfoController,
    ContentBlockController
  ],
  providers: [
    NewsService,
    ContactInfoService,
    ContentBlockService,
    SeedService
  ],
  exports: [
    NewsService,
    ContactInfoService,
    ContentBlockService
  ]
})
export class InformativeModule { }
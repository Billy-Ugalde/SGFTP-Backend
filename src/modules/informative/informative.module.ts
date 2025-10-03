import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ContactInfoController } from "./controllers/contact-info.controller";
import { ContentBlockController } from "./controllers/content-block.controller";
import { ContactInfoService } from "./services/contact-info.service";
import { ContentBlockService } from "./services/content-block.service";
import { ContactInfo } from "./entities/contact-info.entity";
import { ContentBlock } from './entities/content-block.entity';
import { InformativeSeedService } from "./services/informative-seed.service";
import { AuthModule } from "../auth/auth.module";
import { GoogleDriveService } from "../google-drive/google-drive.service";
import { ImageProxyController } from "../google-drive/image-proxy.controller";
@Module({
  imports: [
    TypeOrmModule.forFeature([ContactInfo, ContentBlock]),
    AuthModule
  ],
  controllers: [
    ContactInfoController,
    ContentBlockController,
    ImageProxyController
  ],
  providers: [
    ContactInfoService,
    ContentBlockService,
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
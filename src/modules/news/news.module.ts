import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { NewsController } from "./news.controller"
import { NewsService } from "./news.service";
import { News } from "./entities/news.entity";
import { AuthModule } from "../auth/auth.module";
import { GoogleDriveModule } from "../google-drive/google-drive.module";
import { SharedModule } from "../shared/shared.module";
import { ImageProxyController } from "../google-drive/image-proxy.controller";

@Module({
  imports: [
    TypeOrmModule.forFeature([News]),
    AuthModule,
    GoogleDriveModule,
    SharedModule,
  ],
  controllers: [
    NewsController, ImageProxyController
  ],
  providers: [
    NewsService
  ],
  exports: [
    NewsService
  ]
})
export class NewsModule { }
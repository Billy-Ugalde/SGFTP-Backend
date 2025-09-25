import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { EntrepreneurController } from "./controllers/entreprenuer.controller";
import { Entrepreneur } from "./entities/entrepreneur.entity";
import { Entrepreneurship } from './entities/entrepreneurship.entity';
import { EntrepreneurService } from "./services/entrepreneur.service";
import { EntrepreneurshipService } from "./services/entrepreneurship.service";
import { PersonModule } from "../person/person.module";
import { PasswordService } from "../shared/services/password.service";
import { User } from "../users/entities/user.entity";
import { Role } from "../users/entities/role.entity";
import { AuthModule } from "../auth/auth.module";
import { GoogleDriveModule } from "../google-drive/google-drive.module";
import { ImageProxyController } from "../google-drive/image-proxy.controller";
@Module({
    imports: [
        TypeOrmModule.forFeature([
            Entrepreneur, 
            Entrepreneurship, 
            User, 
            Role
        ]),
        PersonModule,
        AuthModule,
        GoogleDriveModule
    ],
    controllers: [EntrepreneurController,ImageProxyController],
    providers: [
        EntrepreneurService,
        EntrepreneurshipService,
        PasswordService, 
    ]
})
export class EntrepreneurModule { }
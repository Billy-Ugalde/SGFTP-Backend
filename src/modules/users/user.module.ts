import { forwardRef, Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { User } from "./entities/user.entity";
import { UserController } from "./controllers/user.controller";
import { UserService } from "./services/user.service";
import { Role } from "./entities/role.entity";
import { Person } from "src/entities/person.entity";
import { UserAuthService } from "./services/user-auth.service";
import { SharedModule } from "../shared/shared.module";
import { RoleSeedService } from "./services/role-seed.service";
import { UserSeedService } from "./services/user-seed.service";
import { AuthModule } from "../auth/auth.module";
import { AuthEmailService } from "../auth/services/auth-email.service";

@Module({
    imports: [TypeOrmModule.forFeature([User, Role, Person]), SharedModule, forwardRef(() => AuthModule),],
    controllers: [UserController],
    providers: [UserAuthService, UserService, RoleSeedService, UserSeedService, AuthEmailService],
    exports: [UserAuthService, RoleSeedService, UserSeedService],
})
export class UserModule { }
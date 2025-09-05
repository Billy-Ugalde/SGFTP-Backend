import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { User } from "./entities/user.entity";
import { UserController } from "./controllers/user.controller";
import { UserService } from "./services/user.service";
import { Role } from "./entities/role.entity";
import { Person } from "src/entities/person.entity";
import { PasswordService } from "../auth/services/password.service";
@Module({
    imports: [TypeOrmModule.forFeature([User, Role, Person])],
    controllers: [UserController],
    providers: [UserService, PasswordService]
})
export class UserModule { }
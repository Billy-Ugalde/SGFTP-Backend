import { Controller, Get, Param, ParseIntPipe, UseGuards } from "@nestjs/common";
import { StandService } from "../services/stand.service";
import { Stand } from "../entities/stand.entity";
import { AuthGuard } from "src/modules/auth/guards/auth.guard";
import { RoleGuard } from "src/modules/auth/guards/role.guard";
import { Roles } from "src/modules/auth/decorators/roles.decorator";
import { UserRole } from "src/modules/auth/enums/user-role.enum";
@Controller('stand')
@UseGuards(AuthGuard)
export class StandController {
    constructor(private readonly standService: StandService) { }

    @Get()
    @UseGuards(RoleGuard)
    @Roles(UserRole.SUPER_ADMIN, UserRole.GENERAL_ADMIN, UserRole.FAIR_ADMIN,
        UserRole.AUDITOR)
    async getAllStands(): Promise<Stand[]> {
        return this.standService.getAllStandsOrdered();
    }

    @Get(':id_fair')
    @UseGuards(RoleGuard)
    @Roles(UserRole.SUPER_ADMIN, UserRole.GENERAL_ADMIN, UserRole.FAIR_ADMIN,
        UserRole.AUDITOR,UserRole.ENTREPRENEUR)
    async getStandsByFair(
        @Param('id_fair', ParseIntPipe) id_fair: number
    ): Promise<Stand[]> {
        return this.standService.getStandsByFair(id_fair);
    }
}
import { Controller, Post, Get, Patch, Put, Body, Param, ParseIntPipe, HttpCode, HttpStatus, UseGuards } from "@nestjs/common";
import { FairService } from "../services/fair.service";
import { fairDto } from "../dto/createFair.dto";
import { UpdatefairDto } from "../dto/updateFair.dto";
import { Fair } from "../entities/fair.entity";
import { fairStatusDto } from "../dto/fair-status.dto";
import { AuthGuard } from "src/modules/auth/guards/auth.guard";
import { Roles } from "src/modules/auth/decorators/roles.decorator";
import { RoleGuard } from "src/modules/auth/guards/role.guard";
import { UserRole } from "src/modules/auth/enums/user-role.enum";
import { Public } from "src/modules/auth/decorators/public.decorator";

@Controller('fairs')
@UseGuards(AuthGuard)
export class FairController {

    constructor(private readonly fairService: FairService) { }

    @Post()
    @UseGuards(RoleGuard)
    @Roles(UserRole.SUPER_ADMIN, UserRole.GENERAL_ADMIN, UserRole.FAIR_ADMIN)
    @HttpCode(HttpStatus.CREATED)
    async create(
        @Body()
        createFair: fairDto): Promise<Fair> {
        return await this.fairService.create(createFair);
    }

    @Public()
    @Get()
    async getall(): Promise<Fair[]> {
        return await this.fairService.getAll();
    }

    @Get(':id')
    @UseGuards(RoleGuard)
    @Roles(UserRole.SUPER_ADMIN, UserRole.GENERAL_ADMIN, UserRole.FAIR_ADMIN, UserRole.AUDITOR)
    async getOne(@Param('id', ParseIntPipe) id_fair: number): Promise<Fair> {
        return await this.fairService.getOne(id_fair);
    }

    @Put(':id')
    @UseGuards(RoleGuard)
    @Roles(UserRole.SUPER_ADMIN, UserRole.GENERAL_ADMIN, UserRole.FAIR_ADMIN)
    async update(@Param('id', ParseIntPipe) id: number, @Body() updateFair: UpdatefairDto): Promise<Fair> {
        return await this.fairService.update(id, updateFair);
    }

    @Patch(':id')
    @UseGuards(RoleGuard)
    @Roles(UserRole.SUPER_ADMIN, UserRole.GENERAL_ADMIN, UserRole.FAIR_ADMIN)
    async updateStatus(
        @Param('id', ParseIntPipe) id: number,
        @Body() fairstatus: fairStatusDto
    ): Promise<Fair> {
        return await this.fairService.updateStatus(id, fairstatus);
    }
}
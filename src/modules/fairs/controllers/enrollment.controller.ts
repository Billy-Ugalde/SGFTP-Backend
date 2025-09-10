import { Body, Controller, Get, HttpCode, HttpStatus, Param, ParseIntPipe, Patch, Post, UseGuards } from "@nestjs/common";
import { Fair_enrollment } from "../entities/Fair_enrollment.entity";
import { EnrollmentFairDto } from "../dto/enrrolmentFair.dto";
import { EnrrolmentService } from "../services/Enrollment.service";
import { StatusEnrollmentDto } from "../dto/updatestatusEnrollment";
import { AuthGuard } from "src/modules/auth/guards/auth.guard";
import { RoleGuard } from "src/modules/auth/guards/role.guard";
import { Roles } from "src/modules/auth/decorators/roles.decorator";
import { UserRole } from "src/modules/auth/enums/user-role.enum";
import { RateLimitGuard } from "src/modules/auth/guards/rate-limit.guard";
import { RateLimit } from "src/modules/auth/decorators/rate-limit.decorator";
@Controller('enrollment')
@UseGuards(AuthGuard)
@UseGuards(RoleGuard)
@Roles(UserRole.SUPER_ADMIN, UserRole.GENERAL_ADMIN, UserRole.FAIR_ADMIN, UserRole.AUDITOR)
export class EnrollmentController {

    constructor(private readonly fair_enrollmentservice: EnrrolmentService) { }

    @Post()
    @Roles(UserRole.SUPER_ADMIN, UserRole.GENERAL_ADMIN,
        UserRole.FAIR_ADMIN, UserRole.AUDITOR, UserRole.ENTREPRENEUR)
    @UseGuards(RateLimitGuard)
    @RateLimit(5, 15 * 60 * 1000)
    @HttpCode(HttpStatus.CREATED)
    async create(
        @Body()
        createEnrollmentDto: EnrollmentFairDto
    ): Promise<Fair_enrollment> {
        return await this.fair_enrollmentservice.create(createEnrollmentDto);
    }

    @Get()
    async findAll(): Promise<Fair_enrollment[]> {
        return await this.fair_enrollmentservice.findAll();
    }

    @Get('approved')
    async findAllApproved(): Promise<Fair_enrollment[]> {
        return await this.fair_enrollmentservice.findAllApproved();
    }

    @Get('pending')
    async findAllPending(): Promise<Fair_enrollment[]> {
        return await this.fair_enrollmentservice.findAllPending();
    }

    @Get('rejected')
    async findAllRejected(): Promise<Fair_enrollment[]> {
        return await this.fair_enrollmentservice.findAllRejected();
    }

    @Get(':id')
    async findOne(@Param('id', ParseIntPipe) id: number): Promise<Fair_enrollment> {
        return await this.fair_enrollmentservice.findOne(id);
    }

    @Get('fair/:id')
    async findByFair(@Param('id', ParseIntPipe) fairId: number): Promise<Fair_enrollment[]> {
        return await this.fair_enrollmentservice.findByFair(fairId);
    }

    @Patch(':id/status')
    async updateStatus(
        @Param('id', ParseIntPipe) id: number,
        @Body()
        statusDto: StatusEnrollmentDto
    ): Promise<Fair_enrollment> {
        return await this.fair_enrollmentservice.updateStatus(id, statusDto);
    }
}
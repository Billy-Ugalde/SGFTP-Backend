import {
    Body, Controller, Get, HttpCode, HttpStatus, Param,
    ParseIntPipe, Patch, Post, Put, UploadedFiles, UseGuards, UseInterceptors
} from "@nestjs/common";
import { FileFieldsInterceptor, FilesInterceptor } from "@nestjs/platform-express";
import { ActivityService } from "../services/activity.service";
import { Activity } from "../entities/activity.entity";
import { ActivityStatusDto } from "../dto/activityStatus.dto";
import { CreateActivityDto } from "../dto/createActivity.dto";
import { UpdateActivityDto } from "../dto/updateActivity.dto";
import { ActivityFiles } from "../interfaces/activity.interface";
import { ParseJsonFieldsInterceptor } from "src/common/interceptors/parse-json-fields.interceptor";
import { AuthGuard } from "src/modules/auth/guards/auth.guard";
import { RoleGuard } from "src/modules/auth/guards/role.guard";
import { Roles } from "src/modules/auth/decorators/roles.decorator";
import { UserRole } from "src/modules/auth/enums/user-role.enum";
import { Public } from "src/modules/auth/decorators/public.decorator";

@Controller('activities')
@UseGuards(AuthGuard)
export class ActivityController {
    constructor(private activityservice: ActivityService) { }

    @Get('public/active')
    @Public()
    async getActivePublicActivities(): Promise<Activity[]> {
        return await this.activityservice.getActivePublicActivities();
    }

    @Get('public/:id')
    @Public()
    async getPublicActivityById(@Param('id', ParseIntPipe) id_activity: number): Promise<Activity> {
        return await this.activityservice.getPublicActivityById(id_activity);
    }

    @Get()
    @UseGuards(RoleGuard)
    @Roles(UserRole.SUPER_ADMIN, UserRole.GENERAL_ADMIN, UserRole.AUDITOR)
    async getAllActivities(): Promise<Activity[]> {
        return await this.activityservice.getAllActivities();
    }

    @Get(':id')
    @UseGuards(RoleGuard)
    @Roles(UserRole.SUPER_ADMIN, UserRole.GENERAL_ADMIN, UserRole.AUDITOR)
    async getbyIdActivity(@Param('id', ParseIntPipe) id_activity: number): Promise<Activity> {
        return await this.activityservice.getbyIdActivity(id_activity);
    }

    @Patch(':id/status')
    @UseGuards(RoleGuard)
    @Roles(UserRole.SUPER_ADMIN, UserRole.GENERAL_ADMIN)
    async statusActivity(
        @Param('id', ParseIntPipe) id_activity: number,
        @Body() activityStatus: ActivityStatusDto
    ): Promise<Activity> {
        return await this.activityservice.statusActivity(id_activity, activityStatus);
    }

    @Patch('active/:id')
    @UseGuards(RoleGuard)
    @Roles(UserRole.SUPER_ADMIN, UserRole.GENERAL_ADMIN)
    async toggleActive(
        @Param('id', ParseIntPipe) id_activity: number,
        @Body() body: { active: boolean }
    ): Promise<Activity> {
        return await this.activityservice.updateActive(id_activity, body.active);
    }

    @Post()
    @HttpCode(HttpStatus.CREATED)
    @UseGuards(RoleGuard)
    @Roles(UserRole.SUPER_ADMIN, UserRole.GENERAL_ADMIN)
    @UseInterceptors(FilesInterceptor('images', 3), ParseJsonFieldsInterceptor)
    async createActivity(
        @Body() createActivityDto: CreateActivityDto,
        @UploadedFiles() images: Express.Multer.File[]
    ): Promise<Activity> {
        return await this.activityservice.createActivity(createActivityDto, images);
    }

    @Put(':id')
    @UseGuards(RoleGuard)
    @Roles(UserRole.SUPER_ADMIN, UserRole.GENERAL_ADMIN)
    @UseInterceptors(
        FileFieldsInterceptor([
            { name: 'url1_file', maxCount: 1 },
            { name: 'url2_file', maxCount: 1 },
            { name: 'url3_file', maxCount: 1 },
            { name: 'images', maxCount: 3 }
        ]),
        ParseJsonFieldsInterceptor
    )
    async updateActivity(
        @Param('id', ParseIntPipe) id: number,
        @Body() updateActivityDto: UpdateActivityDto,
        @UploadedFiles() files?: ActivityFiles
    ): Promise<Activity> {
        return await this.activityservice.updateActivity(id, updateActivityDto, files);
    }
}
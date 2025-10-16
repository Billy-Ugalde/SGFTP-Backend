import {
    Body, Controller, Get, HttpCode, HttpStatus, Param,
    ParseIntPipe, Patch, Post, Put, UploadedFiles, UseInterceptors
} from "@nestjs/common";
import { FileFieldsInterceptor, FilesInterceptor } from "@nestjs/platform-express";
import { ActivityService } from "../services/activity.service";
import { Activity } from "../entities/activity.entity";
import { ActivityStatusDto } from "../dto/activityStatus.dto";
import { CreateActivityDto } from "../dto/createActivity.dto";
import { UpdateActivityDto } from "../dto/updateActivity.dto";
import { ActivityFiles } from "../interfaces/activity.interface";
import { ParseJsonFieldsInterceptor } from "src/common/interceptors/parse-json-fields.interceptor";

@Controller('activities')
export class ActivityController {
    constructor(private activityservice: ActivityService) { }

    @Get()
    async getAllActivities(): Promise<Activity[]> {
        return await this.activityservice.getAllActivities();
    }

    @Get(':id')
    async getbyIdActivity(@Param('id', ParseIntPipe) id_activity: number): Promise<Activity> {
        return await this.activityservice.getbyIdActivity(id_activity);
    }

    @Patch(':id/status')
    async statusActivity(
        @Param('id', ParseIntPipe) id_activity: number,
        @Body() activityStatus: ActivityStatusDto
    ): Promise<Activity> {
        return await this.activityservice.statusActivity(id_activity, activityStatus);
    }

    @Patch('active/:id')
    async toggleActive(
        @Param('id', ParseIntPipe) id_activity: number,
        @Body() body: { active: boolean }
    ): Promise<Activity> {
        return await this.activityservice.updateActive(id_activity, body.active);
    }

    @Post()
    @HttpCode(HttpStatus.CREATED)
    @UseInterceptors(FilesInterceptor('images', 3), ParseJsonFieldsInterceptor)
    async createActivity(
        @Body() createActivityDto: CreateActivityDto,
        @UploadedFiles() images: Express.Multer.File[]
    ): Promise<Activity> {
        return await this.activityservice.createActivity(createActivityDto, images);
    }

    @Put(':id')
    @UseInterceptors(
        FileFieldsInterceptor([
            { name: 'url_1_file', maxCount: 1 },
            { name: 'url_2_file', maxCount: 1 },
            { name: 'url_3_file', maxCount: 1 },
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
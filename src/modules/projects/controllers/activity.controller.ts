import {
    Body, Controller, Get, HttpCode, HttpStatus, Param,
    ParseIntPipe, Patch, Post, Put, UploadedFile, UploadedFiles, UseInterceptors
} from "@nestjs/common";
import { FileInterceptor} from "@nestjs/platform-express";
import { ActivityService } from "../services/activity.service";
import { Activity } from "../entities/activity.entity";
import { ActivityStatusDto } from "../dto/activityStatus.dto";
import { CreateActivityDto } from "../dto/createActivity.dto";
import { UpdateActivityDto } from "../dto/updateActivity.dto";

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

    @Post()
    @HttpCode(HttpStatus.CREATED)
    @UseInterceptors(FileInterceptor('image'))  
    async createActivity(
        @Body() createActivityDto: CreateActivityDto,
        @UploadedFile() image?: Express.Multer.File  
    ): Promise<Activity> {
        return await this.activityservice.createActivity(createActivityDto, image);
    }

    @Put(':id')
    @UseInterceptors(FileInterceptor('image'))
    async updateProject(
        @Param('id', ParseIntPipe) id: number,
        @Body() updateProject: UpdateActivityDto,
        @UploadedFiles() image?: Express.Multer.File
    ): Promise<Activity> {
        return await this.activityservice.updateActivity(id, updateProject, image);
    }
}
import {
    Body, Controller, Get, HttpCode, HttpStatus, Param,
    ParseIntPipe, Patch, Post, Put, UploadedFile, UploadedFiles, UseInterceptors
} from "@nestjs/common";
import { FileInterceptor, FilesInterceptor } from "@nestjs/platform-express";
import { ActivityService } from "../services/activity.service";
import { Activity } from "../entities/activity.entity";
import { ActivityStatusDto } from "../dto/activityStatus.dto";
import { CreateActivityDto } from "../dto/createActivity.dto";

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
    @UseInterceptors(FileInterceptor('image'))  // ✅ FileInterceptor para UNA imagen
    async createActivity(
        @Body() createActivityDto: CreateActivityDto,
        @UploadedFile() image?: Express.Multer.File  // ✅ @UploadedFile para una sola
    ): Promise<Activity> {
        return await this.activityservice.createActivity(createActivityDto, image);
    }
    /*
        @Put(':id')
        @UseInterceptors(FilesInterceptor('images', 5))
        async updateProject(
            @Param('id', ParseIntPipe) id: number,
            @Body() updateProject: UpdateProjectDto,
            @UploadedFiles() images?: Express.Multer.File[]
        ): Promise<Project> {
            return await this.projectservice.updateProject(id, updateProject, images);
        }*/
}
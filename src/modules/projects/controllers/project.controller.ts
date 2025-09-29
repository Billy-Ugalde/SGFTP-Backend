import { Body, Controller, Get, Param, ParseIntPipe, Patch } from "@nestjs/common";
import { ProjectService } from "../services/project.service";
import { Project } from "../entities/project.entity";
import { ProjectStatusDto } from "../dto/project.dto";

@Controller('projects')
export class ProjectController {
    constructor(private projectservice: ProjectService) { }

    @Get()
    async getall(): Promise<Project[]> {
        return await this.projectservice.getAllProject();
    }

    @Get(':id')
    async getOne(@Param('id', ParseIntPipe) id_project: number): Promise<Project> {
        return await this.projectservice.getbyIdProject(id_project)
    }

    @Patch(':id')
    async statusProject(
        @Param('id', ParseIntPipe) id: number,
        @Body() projectStatus: ProjectStatusDto
    ): Promise<Project> {
        return await this.projectservice.statusProject(id, projectStatus);
    }
}
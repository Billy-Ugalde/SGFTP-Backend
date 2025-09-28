import { Controller, Get, Param, ParseIntPipe } from "@nestjs/common";
import { ProjectService } from "../services/project.service";
import { get } from "http";
import { Project } from "../entities/project.entity";



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

}
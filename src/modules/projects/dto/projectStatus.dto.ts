import { IsEnum } from "class-validator"
import { ProjectStatus } from "../enums/project.enum";

export class ProjectStatusDto {
    @IsEnum(ProjectStatus, {
        message: `El estado debe ser uno de los siguientes: ${Object.values(ProjectStatus).join(', ')}`
    })
    Status: ProjectStatus;
}
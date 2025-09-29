import { IsEnum } from "class-validator"
import { ProjectStatus } from "../enums/project.enum";

export class ProjectStatusDto {
    @IsEnum(ProjectStatus, {
        message: `Estado debe ser: ${Object.values(ProjectStatus).join(', ')}`
    })
    Status: ProjectStatus;
}
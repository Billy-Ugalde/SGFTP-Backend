import { Controller } from "@nestjs/common";
import { ProjectService } from "../services/project.service";



@Controller('projects')
export class ProjectController {
constructor(private projectservice: ProjectService ) { }


}
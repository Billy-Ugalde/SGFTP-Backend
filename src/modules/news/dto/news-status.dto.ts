import { IsNotEmpty, IsEnum} from "class-validator";
import { NewsStatus } from "../entities/news.entity";

export class NewsStatusDto {
    @IsNotEmpty()
    @IsEnum(NewsStatus)
    status: NewsStatus;
}

import { IsBoolean, IsNotEmpty } from "class-validator";

export class NewsStatusDto {
    @IsNotEmpty()
    @IsBoolean()
    status: boolean;
}
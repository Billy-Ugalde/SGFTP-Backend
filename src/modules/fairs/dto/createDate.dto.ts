import { IsNotEmpty } from "class-validator"

export class dateDto {
    @IsNotEmpty()
    readonly dateFairs: string[];
}
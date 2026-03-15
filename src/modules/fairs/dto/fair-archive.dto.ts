import { IsBoolean, IsNotEmpty } from "class-validator";

export class fairArchiveDto {
    @IsNotEmpty()
    @IsBoolean()
    archived: boolean;
}

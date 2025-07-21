import { IsBoolean, IsNotEmpty } from "class-validator";

export class fairStatusDto {
    @IsNotEmpty()
    @IsBoolean()
    status: boolean;
}
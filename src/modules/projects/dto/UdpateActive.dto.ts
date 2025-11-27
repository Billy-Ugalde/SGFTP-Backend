import { IsBoolean, IsNotEmpty } from "class-validator";

export class ToggleActiveDto {
    @IsBoolean()
    @IsNotEmpty()
    active: boolean;
}
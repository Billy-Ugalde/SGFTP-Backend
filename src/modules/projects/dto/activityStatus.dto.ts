import { IsEnum } from "class-validator"
import { ActivityStatus } from "../enums/activity.enum";

export class ActivityStatusDto {
    @IsEnum(ActivityStatus, {
        message: `El estado debe ser uno de los siguientes: ${Object.values(ActivityStatus).join(', ')}`
    })
    Status_activity: ActivityStatus;
}
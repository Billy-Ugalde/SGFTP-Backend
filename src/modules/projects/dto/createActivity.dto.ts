import {
    IsString,
    IsNotEmpty,
    IsBoolean,
    IsEnum,
    IsOptional,
    IsNumber,
    Min
} from 'class-validator';
import {
    TypeActivity,
    ActivityStatus,
    TypeApproach,
    TypeFavorite,
    MetricType
} from '../enums/activity.enum';

export class CreateActivityDto {
    @IsString()
    @IsNotEmpty()
    Name: string;

    @IsString()
    @IsNotEmpty()
    Description: string;

    @IsString()
    @IsNotEmpty()
    Conditions: string;

    @IsString()
    @IsNotEmpty()
    Observations: string;

    @IsBoolean()
    @IsOptional()
    IsRecurring?: boolean;

    @IsEnum(TypeFavorite)
    @IsNotEmpty()
    IsFavorite: TypeFavorite;

    @IsBoolean()
    @IsNotEmpty()
    OpenForRegistration: boolean;

    @IsEnum(TypeActivity)
    @IsNotEmpty()
    Type_campaign: TypeActivity;

    @IsEnum(ActivityStatus)
    @IsNotEmpty()
    Status_campaign: ActivityStatus;

    @IsEnum(TypeApproach)
    @IsNotEmpty()
    Approach: TypeApproach;

    @IsNumber()
    @Min(0)
    @IsOptional()
    Spaces?: number;

    @IsString()
    @IsNotEmpty()
    Location: string;

    @IsString()
    @IsNotEmpty()
    Aim: string;

    @IsEnum(MetricType)
    @IsNotEmpty()
    Metric_activity: MetricType;

    @IsNumber()
    @IsNotEmpty()
    Metric_value: number;

    @IsBoolean()
    @IsNotEmpty()
    Active: boolean;

    @IsNumber()
    @IsNotEmpty()
    Id_project: number;
}


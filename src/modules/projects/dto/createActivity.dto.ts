import {
    IsString,
    IsNotEmpty,
    IsBoolean,
    IsEnum,
    IsOptional,
    IsNumber,
    Min,
    IsInt,
    IsDateString,
    IsArray,
    ValidateNested
} from 'class-validator';
import {
    TypeActivity,
    ActivityStatus,
    TypeApproach,
    TypeFavorite,
    MetricType
} from '../enums/activity.enum';
import { Type } from 'class-transformer';


export class DateDto {
    @IsDateString()
    @IsNotEmpty()
    Start_date: string;

    @IsDateString()
    @IsOptional()
    End_date?: string;

    @IsInt()
    @IsOptional()
    Id_dateActivity?: number;
}

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
    @IsOptional()
    IsFavorite: TypeFavorite;

    @IsBoolean()
    @IsNotEmpty()
    OpenForRegistration: boolean;

    @IsEnum(TypeActivity)
    @IsNotEmpty()
    Type_activity: TypeActivity;

    @IsEnum(ActivityStatus)
    @IsNotEmpty()
    Status_activity: ActivityStatus;

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

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(0)
    Metric_value: number = 0;

    @IsBoolean()
    @IsNotEmpty()
    Active: boolean;

    @IsNumber()
    @IsNotEmpty()
    Id_project: number;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => DateDto)
    dates: DateDto[];
}



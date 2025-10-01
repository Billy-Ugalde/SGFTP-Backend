

import {
    IsString,
    IsBoolean,
    IsEnum,
    IsOptional,
    IsNumber,
    Min,
    IsInt,
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
import { DateDto } from './createActivity.dto';
import { Type } from 'class-transformer';

export class UpdateActivityDto {
    @IsString()
    @IsOptional()
    Name: string;

    @IsString()
    @IsOptional()
    Description: string;

    @IsString()
    @IsOptional()
    Conditions: string;

    @IsString()
    @IsOptional()
    Observations: string;

    @IsBoolean()
    @IsOptional()
    IsRecurring?: boolean;

    @IsEnum(TypeFavorite)
    @IsOptional()
    IsFavorite: TypeFavorite;

    @IsBoolean()
    @IsOptional()
    OpenForRegistration: boolean;

    @IsEnum(TypeActivity)
    @IsOptional()
    Type_activity: TypeActivity;

    @IsEnum(ActivityStatus)
    @IsOptional()
    Status_activity: ActivityStatus;

    @IsEnum(TypeApproach)
    @IsOptional()
    Approach: TypeApproach;

    @IsNumber()
    @Min(0)
    @IsOptional()
    Spaces?: number;

    @IsString()
    @IsOptional()
    Location: string;

    @IsString()
    @IsOptional()
    Aim: string;

    @IsEnum(MetricType)
    @IsOptional()
    Metric_activity: MetricType;

    @IsInt()
    @IsOptional()
    @Min(0)
    Metric_value: number;

    @IsBoolean()
    @IsOptional()
    Active: boolean;

    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => DateDto)
    dateActivities: DateDto[];
}
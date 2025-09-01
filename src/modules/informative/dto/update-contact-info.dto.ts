import {IsEmail, IsOptional, IsString, IsUrl} from 'class-validator';

export class UpdateContactInfoDto {
    @IsOptional()
    @IsEmail()
    email?: string;

    @IsOptional()
    @IsString()
    phone?: string;  

    @IsOptional()
    @IsString()
    address?: string;

    @IsOptional()
    @IsUrl()
    facebook_url?: string;   

    @IsOptional()
    @IsUrl()
    instagram_url?: string;

    @IsOptional()
    @IsUrl()
    whatsapp_url?: string;

    @IsOptional()
    @IsUrl()
    youtube_url?: string;

    @IsOptional()
    @IsUrl()
    google_maps_url?: string;
    
}
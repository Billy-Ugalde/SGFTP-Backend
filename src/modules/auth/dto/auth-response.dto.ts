import { Role } from "src/modules/users/entities/role.entity";

export class PersonDto {
    id: number;
    firstName: string;
    secondName?: string;
    firstLastname: string;
    secondLastname: string;
    email: string;
    phonePrimary: string;
    phoneSecondary?: string;
}

export class AuthResponseDto {
    accessToken: string;
    refreshToken: string;
    user: {
        id: number;
        person: PersonDto;
        roles: string[];
        isEmailVerified: boolean;
    };
}
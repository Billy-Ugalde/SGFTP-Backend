import { Role } from "src/modules/users/entities/role.entity";

export class AuthResponseDto {
    accessToken: string;
    refreshToken: string;
    user: {
        id: number;
        email: string;
        firstName: string;
        firstLastname: string;
        roles: string[];
        primaryRole: string;
        isEmailVerified: boolean;
    };
}
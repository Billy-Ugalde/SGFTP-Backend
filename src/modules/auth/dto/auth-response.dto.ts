export class AuthResponseDto {
    accessToken: string;
    refreshToken: string;
    user: {
        id: number;
        email: string;
        firstName: string;
        firstLastname: string;
        role: string;
        isEmailVerified: boolean;
    };
}
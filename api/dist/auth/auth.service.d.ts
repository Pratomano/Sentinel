import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
export declare class AuthService {
    private readonly usersService;
    private readonly jwtService;
    constructor(usersService: UsersService, jwtService: JwtService);
    register(dto: RegisterDto): Promise<{
        user: {
            id: string;
            email: string;
            createdAt: Date;
        };
        accessToken: string;
    }>;
    login(dto: LoginDto): Promise<{
        user: {
            id: string;
            email: string;
            createdAt: Date;
        };
        accessToken: string;
    }>;
    validateGoogleUser(googleProfile: {
        email: string;
    }): Promise<{
        user: {
            id: string;
            email: string;
            createdAt: Date;
        };
        accessToken: string;
    }>;
    private generateToken;
}

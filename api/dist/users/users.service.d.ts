import { PrismaService } from '../prisma/prisma.service';
export declare class UsersService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    findOrCreateGoogleUser(email: string, provider?: string): Promise<{
        id: string;
        email: string;
        passwordHash: string | null;
        provider: string | null;
        createdAt: Date;
    }>;
    create(email: string, passwordHash: string): Promise<{
        id: string;
        email: string;
        createdAt: Date;
    }>;
    findByEmail(email: string): Promise<{
        id: string;
        email: string;
        passwordHash: string | null;
        provider: string | null;
        createdAt: Date;
    } | null>;
    findById(id: string): Promise<{
        id: string;
        email: string;
        createdAt: Date;
    } | null>;
}

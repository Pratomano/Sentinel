import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
    constructor(private readonly prisma: PrismaService) { }

    async findOrCreateGoogleUser(email: string, provider = 'google') {
        let user = await this.prisma.user.findUnique({ where: { email } });
        
        if (!user) {
            user = await this.prisma.user.create({
                data: {
                    email,
                    provider,
                    passwordHash: null, // Sem senha local para login OAuth
                },
            });
        }
        
        return user;
    }
    
    async create(email: string, passwordHash: string) {
        return this.prisma.user.create({
            data: {
                email,
                passwordHash
            },
            select: {
                id: true,
                email: true,
                createdAt: true,
            },
        })
    }
    
    async findByEmail(email: string) {
        return this.prisma.user.findUnique({
            where: { email },
        });
    }
    async findById(id: string) {
        return this.prisma.user.findUnique({
            where: { id },
            select: {
                id: true,
                email: true,
                createdAt: true,
            },
        })
    }
}

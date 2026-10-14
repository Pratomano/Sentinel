import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ReceiveMetricsDto } from './dto/receive-metrics.dto';
import { PrismaService } from '../prisma/prisma.service';
import * as crypto from 'crypto'

@Injectable()
export class AgentService {

    constructor(private readonly prisma: PrismaService) { }

    async createToken(userId: string) {
        const rawToken = `stn_${crypto.randomBytes(24).toString('hex')}`;

        const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex')

        await this.prisma.agentToken.create({
            data: {
                userId,
                tokenHash,
                name: 'Agente Principal',
            }
        })

        return { token: rawToken }
    }

    async receiveMetrics(dto: ReceiveMetricsDto, rawToken?: string) {
        if (!rawToken) {
            throw new UnauthorizedException('Token do agente ausente')
        }

        const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex')

        const agentToken = await this.prisma.agentToken.findFirst({
            where: { tokenHash }
        })

        if (!agentToken) {
            throw new UnauthorizedException('Token inválido ou revogado')
        }

        const userId = agentToken.userId

        const computer = await this.prisma.computer.upsert({
            where: {
                unique_user_machine: {
                    userId,
                    machineId: dto.machineId,
                },
            },
            update: {
                hostname: dto.hostname,
                lastPing: new Date(),
            },
            create: {
                userId,
                machineId: dto.machineId,
                hostname: dto.hostname,
                lastPing: new Date(),
            },
        })

        await this.prisma.metric.create({
            data: {
                computerId: computer.id,
                cpuUsagePercent: dto.cpu_percent,
                ramTotalBytes: BigInt(dto.memory_total_bytes),
                ramUsedBytes: BigInt(dto.memory_used_bytes),
                ramUsagePercent: dto.memory_percent,
                disks: dto.disks as any,
                collectedAt: new Date(),
            }
        })

        return { status: 'success' }
    }

    async getComputers(userId: string) {
        const computers = await this.prisma.computer.findMany({
            where: { userId: userId },
            include: {
                metrics: {
                    orderBy: { collectedAt: 'desc' },
                    take: 1,
                },
            },
            orderBy: { lastPing: 'desc' }
        })

        return computers.map((comp) => ({
            ...comp,
            metrics: comp.metrics.map((m) => ({
                id: Number(m.id),
                computerId: m.computerId,
                cpuUsagePercent: Number(m.cpuUsagePercent),
                ramTotalBytes: Number(m.ramTotalBytes),
                ramUsedBytes: Number(m.ramUsedBytes),
                ramUsagePercent: Number(m.ramUsagePercent),
                disks: m.disks,
                collectedAt: m.collectedAt,
            })),
        }));
    }
}

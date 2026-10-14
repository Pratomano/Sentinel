import { Module } from '@nestjs/common';
import { AgentController } from './agent.controller';
import { AgentService } from './agent.service';
import { PrismaModule } from 'src/prisma/prisma.module';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  controllers: [AgentController],
  providers: [AgentService],
  imports: [PrismaModule, AuthModule],
})
export class AgentModule { }

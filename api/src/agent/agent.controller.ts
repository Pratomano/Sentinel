import { Controller, Post, Body, HttpCode, HttpStatus, Req, UseGuards, Headers, Get } from '@nestjs/common';
import { AgentService } from './agent.service';
import { ReceiveMetricsDto } from './dto/receive-metrics.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt.auth.guard';

@Controller('agent')
export class AgentController {
  constructor(private readonly agentService: AgentService) { }

  @Post('metrics')
  @HttpCode(HttpStatus.OK)
  async receiveMetrics(@Body() dto: ReceiveMetricsDto, @Headers('x-agent-token') token: string) {
    // Para fins de teste inicial (Prova de Conceito), vamos apenas dar um console.log
    // e devolver uma mensagem de sucesso, antes de ligarmos isso ao Banco de Dados.

    console.log("[SENTINEL] Novas métricas recebidas do Agente:");
    console.log(dto);

    return this.agentService.receiveMetrics(dto, token)
  }

  @UseGuards(JwtAuthGuard)
  @Post('tokens')
  async deliverToken(@Req() req: any) {
    return this.agentService.createToken(req.user.id)
  }

  @UseGuards(JwtAuthGuard)
  @Get('computers')
  async getUserComputer(@Req() req: any) {
    return this.agentService.getComputers(req.user.id)
  }
}

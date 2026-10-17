import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '../api/clients';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import SentinelLogo from '../components/SentinelLogo';

interface DiskMetric {
  device: string;
  total_bytes: number;
  used_bytes: number;
  percent: number;
}

interface MetricData {
  id: number | string;
  computerId: string;
  cpuUsagePercent: number | string;
  ramTotalBytes: number;
  ramUsedBytes: number;
  ramUsagePercent: number | string;
  disks: DiskMetric[];
  collectedAt: string;
}

interface ComputerData {
  id: string;
  userId: string;
  machineId: string;
  hostname: string;
  osInfo: string | null;
  agentVersion: string | null;
  lastPing: string | null;
  createdAt: string;
  metrics: MetricData[];
}

export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [computers, setComputers] = useState<ComputerData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Estados de Geração de Token
  const [generatedToken, setGeneratedToken] = useState<string | null>(null);
  const [isGeneratingToken, setIsGeneratingToken] = useState(false);
  const [copied, setCopied] = useState(false);

  // Busca os computadores na API
  const fetchComputers = useCallback(async (isInitial = false) => {
    try {
      if (isInitial) setIsLoading(true);
      const response = await apiClient.get<ComputerData[]>('/agent/computers');
      setComputers(response.data);
      setError(null);
    } catch (err: any) {
      console.error('Erro ao buscar computadores:', err);
      if (isInitial) {
        setError('Não foi possível carregar os computadores. Verifique se a API está online.');
      }
    } finally {
      if (isInitial) setIsLoading(false);
    }
  }, []);

  // Polling automático a cada 5 segundos
  useEffect(() => {
    fetchComputers(true);

    const interval = setInterval(() => {
      fetchComputers(false);
    }, 5000);

    return () => clearInterval(interval);
  }, [fetchComputers]);

  // Função para gerar um novo token de instalação
  async function handleGenerateToken() {
    try {
      setIsGeneratingToken(true);
      const response = await apiClient.post<{ token: string }>('/agent/tokens');
      setGeneratedToken(response.data.token);
      setCopied(false);
    } catch (err) {
      alert('Erro ao gerar token. Verifique sua conexão.');
    } finally {
      setIsGeneratingToken(false);
    }
  }

  // Copiar token para o clipboard
  function handleCopyToken() {
    if (!generatedToken) return;
    navigator.clipboard.writeText(generatedToken);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  }

  // Deslogar
  function handleLogout() {
    logout();
    navigate('/login');
  }

  // Formata bytes para GB
  function formatBytes(bytes: number) {
    if (!bytes || isNaN(bytes)) return '0 GB';
    const gb = bytes / 1024 ** 3;
    return `${gb.toFixed(1)} GB`;
  }

  // Verifica se o computador está online (ping nos últimos 20 segundos)
  function isComputerOnline(lastPing: string | null) {
    if (!lastPing) return false;
    const diffSeconds = (new Date().getTime() - new Date(lastPing).getTime()) / 1000;
    return diffSeconds < 25;
  }

  // Cor da barra de progresso baseada no percentual
  function getProgressColor(percent: number) {
    if (percent >= 85) return 'bg-rose-500 shadow-rose-500/50';
    if (percent >= 65) return 'bg-amber-500 shadow-amber-500/50';
    return 'bg-emerald-500 shadow-emerald-500/50';
  }

  return (
    <div className="min-h-screen bg-[#0d0914] text-zinc-100 relative overflow-hidden flex flex-col font-sans">
      {/* Luzes de Fundo Sentinel */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-purple-600/20 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-[30%] right-[-10%] w-[500px] h-[500px] bg-fuchsia-600/15 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[20%] w-[500px] h-[500px] bg-blue-600/15 rounded-full blur-[140px] pointer-events-none" />

      {/* TOPBAR */}
      <header className="border-b border-purple-500/20 bg-[#150f1f]/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-3 group">
            <SentinelLogo className="w-10 h-10 transition-transform group-hover:scale-105" />
            <div>
              <span className="font-bold text-lg text-white tracking-wide group-hover:text-purple-200 transition-colors">
                SENTINEL
              </span>
              <span className="text-xs ml-2 px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-medium border border-purple-500/30">
                PROJETO JAMES BOND
              </span>
            </div>
          </Link>

          <div className="flex items-center space-x-4">
            <div className="hidden sm:flex items-center space-x-2 text-xs text-purple-300/70 bg-purple-950/40 px-3 py-1.5 rounded-lg border border-purple-500/20">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span>Telemetria em Tempo Real (5s)</span>
            </div>

            <div className="flex items-center space-x-3 pl-2 border-l border-purple-500/20">
              <div className="text-right hidden md:block">
                <p className="text-xs text-purple-200 font-medium">{user?.email || 'Agente'}</p>
                <p className="text-[10px] text-purple-400/60">Sessão Autenticada</p>
              </div>
              <button
                onClick={handleLogout}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-300 border border-red-500/30 transition-all cursor-pointer"
                title="Encerrar sessão"
              >
                Sair
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* CONTEÚDO PRINCIPAL */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full relative z-10 space-y-8">
        {/* HERO / PAINEL DE CONTROLE RÁPIDO */}
        <section className="p-6 sm:p-8 rounded-2xl bg-[#150f1f]/60 border border-purple-500/20 backdrop-blur-xl shadow-2xl relative overflow-hidden">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                Painel de Telemetria Sentinel
              </h1>
              <p className="text-purple-300/70 mt-1 text-sm max-w-2xl">
                Monitore em tempo real o uso de Processador, Memória RAM e volumes de Armazenamento das máquinas Windows vinculadas à sua conta.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
              {/* Botão Gerar Chave */}
              <button
                onClick={handleGenerateToken}
                disabled={isGeneratingToken}
                className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 text-white text-sm font-semibold transition-all shadow-lg shadow-purple-600/30 flex items-center justify-center space-x-2 disabled:opacity-50 cursor-pointer"
              >
                <span>🔑</span>
                <span>{isGeneratingToken ? 'Gerando Chave...' : 'Gerar Chave de Agente'}</span>
              </button>

              {/* Botão Baixar Agente */}
              <a
                href="/sentinel-agent.exe"
                download="sentinel-agent.exe"
                className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-purple-950/60 hover:bg-purple-900/60 text-purple-200 hover:text-white border border-purple-500/30 text-sm font-semibold transition-all flex items-center justify-center space-x-2 cursor-pointer"
              >
                <span>⬇️</span>
                <span>Baixar Agente (.exe)</span>
              </a>
            </div>
          </div>

          {/* BANNER DE EXIBIÇÃO DE NOVO TOKEN GERADO */}
          {generatedToken && (
            <div className="mt-6 p-4 rounded-xl bg-purple-950/70 border border-fuchsia-500/40 text-purple-100 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 animate-in fade-in duration-300">
              <div className="flex-1">
                <div className="flex items-center space-x-2 text-xs font-bold text-fuchsia-300 uppercase tracking-wider mb-1">
                  <span>⚡ Sua Nova Chave de Instalação</span>
                  <span className="text-[10px] bg-fuchsia-500/20 px-2 py-0.5 rounded text-fuchsia-300">Guarde com segurança</span>
                </div>
                <p className="text-xs text-purple-300/80 mb-2">
                  Copie este token e cole no seu robô Sentinel para conectar uma nova máquina à sua conta:
                </p>
                <div className="font-mono text-sm bg-black/60 px-3 py-2 rounded-lg border border-purple-500/30 text-fuchsia-200 select-all break-all">
                  {generatedToken}
                </div>
              </div>
              <div className="flex items-center space-x-2 w-full md:w-auto">
                <button
                  onClick={handleCopyToken}
                  className="w-full md:w-auto px-4 py-2 rounded-lg bg-fuchsia-600 hover:bg-fuchsia-500 text-white font-semibold text-xs transition-all shadow-md shadow-fuchsia-600/30 flex items-center justify-center space-x-1 cursor-pointer"
                >
                  <span>{copied ? '✓ Copiado!' : '📋 Copiar Chave'}</span>
                </button>
                <button
                  onClick={() => setGeneratedToken(null)}
                  className="px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-purple-300 text-xs transition-all cursor-pointer"
                  title="Fechar"
                >
                  ✕
                </button>
              </div>
            </div>
          )}
        </section>

        {/* MENSAGEM DE ERRO (SE HOUVER) */}
        {error && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-sm flex items-center justify-between">
            <span>{error}</span>
            <button
              onClick={() => fetchComputers(true)}
              className="text-xs underline hover:text-white cursor-pointer ml-4 font-semibold"
            >
              Tentar Novamente
            </button>
          </div>
        )}

        {/* ESTADO DE CARREGAMENTO */}
        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2].map((i) => (
              <div key={i} className="h-64 rounded-2xl bg-purple-950/20 border border-purple-500/10 animate-pulse" />
            ))}
          </div>
        )}

        {/* ESTADO VAZIO (NENHUM COMPUTADOR VINCULADO) */}
        {!isLoading && computers.length === 0 && (
          <div className="text-center py-16 px-4 rounded-2xl bg-[#150f1f]/40 border border-purple-500/20 backdrop-blur-xl">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-purple-600/20 flex items-center justify-center text-3xl border border-purple-500/30">
              🛰️
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Nenhum computador conectado ainda</h3>
            <p className="text-purple-300/70 max-w-md mx-auto text-sm mb-6">
              Para começar o monitoramento, gere uma chave acima, configure o seu robô Sentinel no Windows e inicie a transmissão.
            </p>
            <div className="inline-flex flex-col sm:flex-row items-center gap-4 text-xs text-purple-300/80 bg-black/40 p-4 rounded-xl border border-purple-500/20">
              <span className="flex items-center space-x-1.5">
                <span className="w-5 h-5 rounded-full bg-purple-600 text-white font-bold flex items-center justify-center">1</span>
                <span>Clique em "Gerar Chave"</span>
              </span>
              <span className="text-purple-500 hidden sm:inline">➔</span>
              <span className="flex items-center space-x-1.5">
                <span className="w-5 h-5 rounded-full bg-purple-600 text-white font-bold flex items-center justify-center">2</span>
                <span>Cole no seu agente</span>
              </span>
              <span className="text-purple-500 hidden sm:inline">➔</span>
              <span className="flex items-center space-x-1.5">
                <span className="w-5 h-5 rounded-full bg-purple-600 text-white font-bold flex items-center justify-center">3</span>
                <span>Veja as métricas ao vivo!</span>
              </span>
            </div>
          </div>
        )}

        {/* LISTAGEM DOS COMPUTADORES MONITORADOS */}
        {!isLoading && computers.length > 0 && (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {computers.map((computer) => {
              const latestMetric = computer.metrics?.[0];
              const isOnline = isComputerOnline(computer.lastPing);

              const cpuPercent = Number(latestMetric?.cpuUsagePercent || 0);
              const ramPercent = Number(latestMetric?.ramUsagePercent || 0);
              const ramUsed = latestMetric?.ramUsedBytes || 0;
              const ramTotal = latestMetric?.ramTotalBytes || 0;
              const disks = latestMetric?.disks || [];

              return (
                <div
                  key={computer.id}
                  className="p-6 rounded-2xl bg-[#150f1f]/80 border border-purple-500/30 backdrop-blur-xl shadow-xl hover:border-purple-500/50 transition-all space-y-6 flex flex-col justify-between"
                >
                  {/* CABEÇALHO DO COMPUTADOR */}
                  <div className="flex items-start justify-between gap-4 pb-4 border-b border-purple-500/20">
                    <div className="flex items-center space-x-3.5">
                      <div className="w-12 h-12 rounded-xl bg-purple-900/40 border border-purple-500/30 flex items-center justify-center text-2xl shadow-inner">
                        💻
                      </div>
                      <div>
                        <h3 className="font-bold text-lg text-white tracking-wide flex items-center gap-2">
                          {computer.hostname}
                        </h3>
                        <p className="text-xs text-purple-300/60 font-mono">
                          ID: {computer.machineId}
                        </p>
                      </div>
                    </div>

                    {/* STATUS BADGE ONLINE/OFFLINE */}
                    <div
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold flex items-center space-x-1.5 border ${isOnline
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                          : 'bg-zinc-500/10 text-zinc-400 border-zinc-500/30'
                        }`}
                    >
                      <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-zinc-500'}`} />
                      <span>{isOnline ? 'ONLINE' : 'OFFLINE'}</span>
                    </div>
                  </div>

                  {/* CARDS DE MÉTRICAS */}
                  {!latestMetric ? (
                    <div className="text-center py-8 text-purple-300/50 text-sm">
                      Aguardando primeiro envio de dados do computador...
                    </div>
                  ) : (
                    <div className="space-y-5">
                      {/* PROCESSADOR (CPU) */}
                      <div>
                        <div className="flex items-center justify-between text-xs mb-1.5">
                          <span className="font-medium text-purple-200/90 flex items-center gap-1.5">
                            <span>⚡</span> Processador (CPU)
                          </span>
                          <span className="font-bold text-white font-mono text-sm">{cpuPercent.toFixed(1)}%</span>
                        </div>
                        <div className="w-full h-2.5 rounded-full bg-black/50 overflow-hidden p-0.5 border border-purple-500/20">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${getProgressColor(cpuPercent)}`}
                            style={{ width: `${Math.min(cpuPercent, 100)}%` }}
                          />
                        </div>
                      </div>

                      {/* MEMÓRIA RAM */}
                      <div>
                        <div className="flex items-center justify-between text-xs mb-1.5">
                          <span className="font-medium text-purple-200/90 flex items-center gap-1.5">
                            <span>🧠</span> Memória RAM
                          </span>
                          <div className="text-right">
                            <span className="font-bold text-white font-mono text-sm mr-2">{ramPercent.toFixed(1)}%</span>
                            <span className="text-[11px] text-purple-300/60 font-mono">
                              ({formatBytes(ramUsed)} / {formatBytes(ramTotal)})
                            </span>
                          </div>
                        </div>
                        <div className="w-full h-2.5 rounded-full bg-black/50 overflow-hidden p-0.5 border border-purple-500/20">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${getProgressColor(ramPercent)}`}
                            style={{ width: `${Math.min(ramPercent, 100)}%` }}
                          />
                        </div>
                      </div>

                      {/* VOLUMES DE DISCO (MULTI-DISCO) */}
                      <div className="pt-2">
                        <span className="text-xs font-semibold text-purple-300/80 mb-2 block flex items-center gap-1.5">
                          <span>💾</span> Armazenamento ({disks.length} {disks.length === 1 ? 'Volume' : 'Volumes'})
                        </span>

                        <div className="space-y-3">
                          {disks.length === 0 ? (
                            <p className="text-xs text-purple-400/50">Nenhum disco detectado.</p>
                          ) : (
                            disks.map((disk, idx) => (
                              <div key={idx} className="bg-black/30 p-2.5 rounded-xl border border-purple-500/15">
                                <div className="flex items-center justify-between text-xs mb-1.5">
                                  <span className="font-mono text-purple-200 font-bold">{disk.device}</span>
                                  <div className="text-right">
                                    <span className="font-bold text-white font-mono text-xs mr-2">
                                      {disk.percent.toFixed(1)}%
                                    </span>
                                    <span className="text-[10px] text-purple-300/60 font-mono">
                                      ({formatBytes(disk.used_bytes)} / {formatBytes(disk.total_bytes)})
                                    </span>
                                  </div>
                                </div>
                                <div className="w-full h-2 rounded-full bg-black/50 overflow-hidden p-0.5 border border-purple-500/20">
                                  <div
                                    className={`h-full rounded-full transition-all duration-500 ${getProgressColor(disk.percent)}`}
                                    style={{ width: `${Math.min(disk.percent, 100)}%` }}
                                  />
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* RODAPÉ DO CARD */}
                  <div className="pt-3 border-t border-purple-500/15 flex items-center justify-between text-[11px] text-purple-300/50">
                    <span>
                      Última leitura:{' '}
                      {latestMetric?.collectedAt
                        ? new Date(latestMetric.collectedAt).toLocaleTimeString()
                        : 'Nunca'}
                    </span>
                    <span>
                      Cadastrado em: {new Date(computer.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}

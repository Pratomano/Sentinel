import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import SentinelLogo from '../components/SentinelLogo';

export default function Landing() {
    const { isAuthenticated } = useAuth();

    return (
        <div className="min-h-screen bg-[#0d0914] text-zinc-100 relative overflow-hidden flex flex-col justify-between selection:bg-fuchsia-500/30 selection:text-fuchsia-200">
            {/* Background Ambient Glows */}
            <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-purple-600/20 rounded-full blur-[140px] pointer-events-none" />
            <div className="absolute top-[30%] right-[-10%] w-[550px] h-[550px] bg-blue-600/15 rounded-full blur-[150px] pointer-events-none" />
            <div className="absolute bottom-[-10%] left-[20%] w-[600px] h-[600px] bg-fuchsia-600/15 rounded-full blur-[160px] pointer-events-none" />

            {/* Navbar */}
            <header className="relative z-10 w-full max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
                <Link to="/" className="flex items-center space-x-3 group">
                    <SentinelLogo className="w-11 h-11 transition-transform group-hover:scale-105" />
                    <div>
                        <span className="text-xl font-bold tracking-tight text-white block group-hover:text-purple-200 transition-colors">
                            Sentinel
                        </span>
                        <span className="text-[10px] uppercase font-mono tracking-widest text-purple-400/80 -mt-1 block">
                            Telemetry OS
                        </span>
                    </div>
                </Link>

                <nav className="flex items-center space-x-3 sm:space-x-4">
                    {isAuthenticated ? (
                        <Link
                            to="/dashboard"
                            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 text-white font-medium text-sm transition-all shadow-lg shadow-purple-600/25 flex items-center space-x-2 border border-purple-400/30"
                        >
                            <span>Acessar Painel</span>
                            <span>→</span>
                        </Link>
                    ) : (
                        <>
                            <Link
                                to="/login"
                                className="px-4 py-2 rounded-xl text-sm font-medium text-purple-200/80 hover:text-white hover:bg-purple-900/30 transition-all border border-transparent hover:border-purple-500/20"
                            >
                                Entrar
                            </Link>
                            <Link
                                to="/register"
                                className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 text-white text-sm font-medium transition-all shadow-md shadow-purple-600/25 border border-purple-400/30"
                            >
                                Criar Conta
                            </Link>
                        </>
                    )}
                </nav>
            </header>

            {/* Main Content */}
            <main className="relative z-10 max-w-7xl mx-auto px-6 pt-10 pb-20 flex-1 flex flex-col justify-center">
                {/* Hero Section */}
                <div className="text-center max-w-3xl mx-auto mt-6 sm:mt-12">
                    <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-purple-950/80 border border-purple-500/30 text-purple-300 text-xs font-medium mb-6 backdrop-blur-md shadow-inner">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        <span>Monitoramento Contínuo para Windows 10 e 11</span>
                    </div>

                    <h1 className="text-4xl sm:text-6xl font-black text-white tracking-tight leading-[1.15]">
                        Telemetria em tempo real,{' '}
                        <span className="bg-gradient-to-r from-purple-400 via-fuchsia-400 to-blue-400 bg-clip-text text-transparent">
                            sem complicação
                        </span>
                    </h1>

                    <p className="mt-6 text-base sm:text-lg text-purple-200/70 leading-relaxed max-w-2xl mx-auto">
                        Acompanhe o consumo de <strong className="text-purple-100 font-semibold">Processador (CPU)</strong>,{' '}
                        <strong className="text-purple-100 font-semibold">Memória RAM</strong> e{' '}
                        <strong className="text-purple-100 font-semibold">Discos</strong> dos seus computadores Windows através de um agente leve e um painel web intuitivo.
                    </p>

                    <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
                        {isAuthenticated ? (
                            <Link
                                to="/dashboard"
                                className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 text-white font-semibold text-base transition-all shadow-xl shadow-purple-600/30 border border-purple-400/30 flex items-center justify-center space-x-2"
                            >
                                <span>Ir para o Dashboard</span>
                                <span>→</span>
                            </Link>
                        ) : (
                            <>
                                <Link
                                    to="/register"
                                    className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 text-white font-semibold text-base transition-all shadow-xl shadow-purple-600/30 border border-purple-400/30 flex items-center justify-center space-x-2"
                                >
                                    <span>Começar Gratuitamente</span>
                                    <span>→</span>
                                </Link>
                                <Link
                                    to="/login"
                                    className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-[#150f1f]/80 hover:bg-[#1a1327] text-purple-200 hover:text-white border border-purple-500/20 text-base font-medium transition-all backdrop-blur-md flex items-center justify-center"
                                >
                                    Já possuo uma conta
                                </Link>
                            </>
                        )}
                    </div>
                </div>

                {/* Feature Grid */}
                <section className="mt-20 sm:mt-28 grid grid-cols-1 md:grid-cols-3 gap-6" aria-label="Recursos Principais">
                    <div className="p-6 rounded-2xl bg-[#150f1f]/60 border border-purple-500/20 backdrop-blur-xl hover:border-purple-500/40 transition-all shadow-lg shadow-purple-950/40">
                        <div className="w-12 h-12 rounded-xl bg-purple-900/40 border border-purple-500/30 flex items-center justify-center text-2xl mb-4">
                            ⚡
                        </div>
                        <h2 className="text-lg font-bold text-white mb-2">Métricas de Hardware em Tempo Real</h2>
                        <p className="text-sm text-purple-300/70 leading-relaxed">
                            Leituras contínuas de CPU, utilização detalhada de memória e volumetria por partição de disco a cada 5 segundos.
                        </p>
                    </div>

                    <div className="p-6 rounded-2xl bg-[#150f1f]/60 border border-purple-500/20 backdrop-blur-xl hover:border-purple-500/40 transition-all shadow-lg shadow-purple-950/40">
                        <div className="w-12 h-12 rounded-xl bg-fuchsia-900/40 border border-fuchsia-500/30 flex items-center justify-center text-2xl mb-4">
                            🪶
                        </div>
                        <h2 className="text-lg font-bold text-white mb-2">Agente Leve e Portátil</h2>
                        <p className="text-sm text-purple-300/70 leading-relaxed">
                            Executável portátil para Windows que roda diretamente sem instalação e sem necessidade de privilégios de administrador.
                        </p>
                    </div>

                    <div className="p-6 rounded-2xl bg-[#150f1f]/60 border border-purple-500/20 backdrop-blur-xl hover:border-purple-500/40 transition-all shadow-lg shadow-purple-950/40">
                        <div className="w-12 h-12 rounded-xl bg-blue-900/40 border border-blue-500/30 flex items-center justify-center text-2xl mb-4">
                            🔒
                        </div>
                        <h2 className="text-lg font-bold text-white mb-2">Privacidade e Isolamento</h2>
                        <p className="text-sm text-purple-300/70 leading-relaxed">
                            Isolamento total de dados entre contas. Chaves criptografadas via SHA-256 e coleta restrita a métricas operacionais do sistema.
                        </p>
                    </div>
                </section>

                {/* Como Funciona Section */}
                <section className="mt-20 p-8 sm:p-10 rounded-3xl bg-[#150f1f]/40 border border-purple-500/20 backdrop-blur-xl" aria-label="Como Funciona">
                    <div className="text-center max-w-xl mx-auto mb-10">
                        <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Como funciona a plataforma?</h2>
                        <p className="text-purple-300/60 text-sm mt-2">
                            Jornada rápida e transparente em apenas três etapas simples.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="flex flex-col items-center text-center">
                            <div className="w-10 h-10 rounded-full bg-purple-600/30 border border-purple-400/40 text-purple-300 font-bold flex items-center justify-center mb-4 text-sm font-mono">
                                1
                            </div>
                            <h3 className="text-base font-semibold text-white mb-1">Crie sua Conta</h3>
                            <p className="text-xs text-purple-300/70 leading-relaxed max-w-xs">
                                Registre-se utilizando e-mail e senha ou faça login com um único clique via autenticação Google.
                            </p>
                        </div>

                        <div className="flex flex-col items-center text-center">
                            <div className="w-10 h-10 rounded-full bg-fuchsia-600/30 border border-fuchsia-400/40 text-fuchsia-300 font-bold flex items-center justify-center mb-4 text-sm font-mono">
                                2
                            </div>
                            <h3 className="text-base font-semibold text-white mb-1">Conecte o Agente</h3>
                            <p className="text-xs text-purple-300/70 leading-relaxed max-w-xs">
                                Na área autenticada, gere sua chave única de telemetria, baixe o executável portátil e inicie o monitoramento.
                            </p>
                        </div>

                        <div className="flex flex-col items-center text-center">
                            <div className="w-10 h-10 rounded-full bg-blue-600/30 border border-blue-400/40 text-blue-300 font-bold flex items-center justify-center mb-4 text-sm font-mono">
                                3
                            </div>
                            <h3 className="text-base font-semibold text-white mb-1">Acompanhe em Tempo Real</h3>
                            <p className="text-xs text-purple-300/70 leading-relaxed max-w-xs">
                                Visualize seus computadores conectados, status de conectividade e oscilações de consumo no painel.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Transparência e Privacidade (Regra 42) */}
                <section className="mt-12 p-6 rounded-2xl bg-purple-950/30 border border-purple-500/20 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-start space-x-4">
                        <div className="text-2xl mt-0.5">🛡️</div>
                        <div>
                            <h3 className="text-sm font-bold text-white">Compromisso com a Privacidade e Segurança</h3>
                            <p className="text-xs text-purple-300/70 mt-1 max-w-2xl leading-relaxed">
                                O Sentinel coleta estritamente métricas de capacidade e utilização de processamento, memória e armazenamento físico.
                                Não são coletados arquivos, nomes de documentos, histórico de navegação, senhas ou quaisquer informações pessoais.
                            </p>
                        </div>
                    </div>
                    <div className="shrink-0">
                        <span className="text-[11px] font-mono px-3 py-1.5 rounded-lg bg-purple-900/40 text-purple-300 border border-purple-500/30">
                            Windows 10 / 11 Ready
                        </span>
                    </div>
                </section>
            </main>

            {/* Footer */}
            <footer className="relative z-10 border-t border-purple-500/15 py-8 text-center text-xs text-purple-300/50">
                <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center space-x-2">
                        <SentinelLogo size={18} glow={false} />
                        <span className="font-semibold text-purple-200">Sentinel</span>
                        <span>•</span>
                        <span>Plataforma de Monitoramento para Windows</span>
                    </div>
                    <div className="flex items-center space-x-4">
                        <span>Desenvolvido por <strong>Diogo Kalluf</strong></span>
                        <span>•</span>
                        <a
                            href="https://github.com/Pratomano/Sentinel"
                            target="_blank"
                            rel="noreferrer"
                            className="text-purple-300 hover:text-white transition-colors underline underline-offset-2"
                        >
                            GitHub
                        </a>
                    </div>
                </div>
            </footer>
        </div>
    );
}

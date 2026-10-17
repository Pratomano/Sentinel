import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import { apiClient } from '../api/clients';
import { useAuth } from '../contexts/AuthContext';
import SentinelLogo from '../components/SentinelLogo';

// 1. Schema de Validação (O Zod barra os erros antes de enviar pra API)
const loginSchema = z.object({
  email: z.string().email('Digite um e-mail válido'),
  password: z.string().min(6, 'A senha precisa ter no mínimo 6 caracteres'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function Login() {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  // Puxamos a função 'login' da nossa "Rádio" global
  const { login } = useAuth();

  // 2. Conectando o React Hook Form com o Zod
  // Atenção: A função interna chama 'register', mesmo sendo tela de Login!
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  // 3. Função de envio para o Backend
  async function handleLoginSubmit(data: LoginFormData) {
    try {
      setError(null);
      setIsLoading(true);

      // Chamando a nossa API do NestJS (Rota POST /auth/login)
      const response = await apiClient.post('/auth/login', data);

      // 4. Salva no nosso Contexto (O "Crachá")
      // Obs: Ajuste "response.data.token" conforme o formato exato que o NestJS te devolve. 
      // Em muitas APIs NestJS padrão, o token vem em response.data.accessToken
      login(response.data.token || response.data.accessToken, response.data.user || response.data);

      // 5. Entra no Dashboard Protegido
      navigate('/dashboard');
    } catch (err: any) {
      // Capturando mensagens de erro do NestJS (Ex: "Credenciais inválidas")
      const message = err.response?.data?.message || 'Erro ao acessar a conta. Verifique suas credenciais.';
      setError(Array.isArray(message) ? message[0] : message);
    } finally {
      setIsLoading(false);
    }
  }

  // Rota do NestJS para o Google OAuth
  const handleGoogleLogin = () => {
    window.location.href = `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/auth/google`;
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0d0914] relative overflow-hidden">
      {/* Efeitos de Fundo - Paleta Sentinel Marvel (Roxo/Magenta e Azul) */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-purple-600/30 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-blue-600/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-[40%] left-[60%] w-64 h-64 bg-fuchsia-600/20 rounded-full blur-[100px] pointer-events-none" />

      {/* Cartão de Login (Glassmorphism) */}
      <div className="w-full max-w-md p-8 rounded-2xl bg-[#150f1f]/60 border border-purple-500/20 backdrop-blur-xl shadow-2xl shadow-purple-900/20 relative z-10">
        <div className="text-center mb-8 flex flex-col items-center">
          <Link to="/" className="mb-4 group">
            <SentinelLogo className="w-16 h-16 transition-transform group-hover:scale-105" />
          </Link>
          <h1 className="text-3xl font-bold text-zinc-100 tracking-tight">Acessar Dashboard</h1>
          <p className="text-purple-300/60 mt-2 text-sm">Acesse a plataforma Sentinel</p>
        </div>

        {error && (
          <div className="mb-6 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center">
            {error}
          </div>
        )}

        {/* Cuidado aqui: handleSubmit recebe a nossa função customizada handleLoginSubmit */}
        <form onSubmit={handleSubmit(handleLoginSubmit)} className="space-y-5">
          {/* Campo: Email */}
          <div>
            <label className="block text-sm font-medium text-purple-200/80 mb-1" htmlFor="email">
              E-mail
            </label>
            {/* Cuidado aqui: A função de input se chama 'register' */}
            <input
              id="email"
              type="email"
              className="w-full px-4 py-3 rounded-xl bg-black/40 border border-purple-500/30 text-zinc-100 focus:outline-none focus:ring-2 focus:ring-fuchsia-500/50 focus:border-fuchsia-500 transition-all placeholder:text-zinc-600"
              placeholder="007@mi6.gov.uk"
              {...register('email')}
            />
            {errors.email && <span className="text-xs text-red-400 mt-1 block">{errors.email.message}</span>}
          </div>

          {/* Campo: Senha */}
          <div>
            <label className="block text-sm font-medium text-purple-200/80 mb-1" htmlFor="password">
              Senha
            </label>
            {/* Cuidado aqui: A função de input se chama 'register' */}
            <input
              id="password"
              type="password"
              className="w-full px-4 py-3 rounded-xl bg-black/40 border border-purple-500/30 text-zinc-100 focus:outline-none focus:ring-2 focus:ring-fuchsia-500/50 focus:border-fuchsia-500 transition-all placeholder:text-zinc-600"
              placeholder="••••••••"
              {...register('password')}
            />
            {errors.password && <span className="text-xs text-red-400 mt-1 block">{errors.password.message}</span>}
          </div>

          {/* Botão de Login */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 px-4 mt-2 rounded-xl bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 text-white font-semibold transition-all shadow-lg shadow-purple-500/30 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Acessando plataforma...' : 'Acessar'}
          </button>
        </form>

        <div className="my-6 flex items-center justify-between">
          <span className="border-b border-purple-500/20 w-full" />
          <span className="text-xs text-purple-300/50 uppercase tracking-widest mx-4">ou</span>
          <span className="border-b border-purple-500/20 w-full" />
        </div>

        {/* Botão do Google */}
        <button
          onClick={handleGoogleLogin}
          type="button"
          className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl bg-[#1e152e] hover:bg-[#2a1d40] text-purple-100 font-medium transition-colors border border-purple-500/30"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
          </svg>
          Acessar com Google
        </button>

        <p className="text-center text-sm text-purple-300/60 mt-8">
          Não possui uma conta?{' '}
          <Link to="/register" className="text-fuchsia-400 hover:text-fuchsia-300 font-medium transition-colors">
            Fazer cadastro
          </Link>
        </p>
      </div>
    </div>
  );
}

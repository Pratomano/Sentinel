import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function AuthSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuth();

  useEffect(() => {
    // 1. Lemos a URL procurando pelo "?token=xxxxx"
    const token = searchParams.get('token');

    if (token) {
      // Como o Back-end mandou apenas o Token pela URL (por questão de limite de tamanho),
      // nós extraímos os dados do usuário "abrindo" o próprio cofre do JWT.
      let userData = { id: '0', email: 'google@user.com', name: 'Usuário Google' };

      try {
        // Tenta decodificar o Payload do JWT do NestJS para pegar os dados reais embutidos nele
        const payloadBase64 = token.split('.')[1];
        if (payloadBase64) {
          const decodedJson = atob(payloadBase64);
          const decoded = JSON.parse(decodedJson);
          userData = {
            id: decoded.sub || '0',
            email: decoded.email || 'google@user.com',
            name: decoded.name || 'Usuário Google',
          };
        }
      } catch (e) {
        console.error('Erro ao decodificar token do Google', e);
      }

      // 2. Injetamos o Token e o Usuário na nossa "Estação de Rádio" (AuthContext)
      login(token, userData as any);

      // 3. Liberado! Redireciona para o Dashboard e impede o botão "voltar" do navegador
      navigate('/dashboard', { replace: true });
    } else {
      // Se alguém tentou acessar a rota direto sem um token, joga pro login
      navigate('/login', { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#0d0914] relative overflow-hidden">
      {/* Efeitos de Fundo - Paleta Sentinel */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-purple-600/30 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-blue-600/20 rounded-full blur-[120px] pointer-events-none" />

      {/* Interface de Carregamento Premium */}
      <div className="text-center z-10 flex flex-col items-center">
        {/* Spinner animado com a cor Fúcsia */}
        <div className="w-16 h-16 border-4 border-purple-500/20 border-t-fuchsia-500 rounded-full animate-spin mb-8 shadow-lg shadow-fuchsia-500/20"></div>
        <h1 className="text-2xl font-bold text-zinc-100 tracking-tight animate-pulse">Autenticando Conexão</h1>
        <p className="text-purple-300/60 mt-2 text-sm">Estabelecendo link seguro com os servidores Sentinel...</p>
      </div>
    </div>
  );
}

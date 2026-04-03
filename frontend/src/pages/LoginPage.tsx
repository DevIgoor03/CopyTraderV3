import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { TrendingUp, Moon, Sun, Eye, EyeOff, ArrowRight, ChevronRight, Shield } from 'lucide-react';
import { authApi, tokenStore } from '../services/api';
import { useTheme } from '../hooks/useTheme';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const navigate         = useNavigate();
  const { isDark, toggle } = useTheme();
  const [email,      setEmail]      = useState('');
  const [password,   setPassword]   = useState('');
  const [showPw,     setShowPw]     = useState(false);
  const [loading,    setLoading]    = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await authApi.login(email, password);
      tokenStore.setTokens(data.accessToken, data.refreshToken);
      tokenStore.setUser(data.user);

      if (data.user?.role === 'ADMIN') {
        toast.success(`Olá, ${data.user.name}`);
        navigate('/admin', { replace: true });
        return;
      }
      toast.success(`Bem-vindo, ${data.user.name}!`);
      navigate('/dashboard', { replace: true });
    } catch (err: any) {
      const msg = err.response?.data?.error ?? err.message ?? 'Erro ao autenticar';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-[var(--bg)]">
      <div className="hidden lg:flex lg:w-[55%] bg-brand-600 relative overflow-hidden flex-col justify-between p-12 text-white">
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-white/10" />
        <div className="absolute bottom-12 -left-24 w-80 h-80 rounded-full bg-white/10" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-white/[0.04]" />

        <div className="relative flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight">CopyTrader</span>
        </div>

        <div className="relative">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur rounded-full px-4 py-1.5 text-sm font-medium mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse" />
            Sistema profissional de copy trading
          </div>
          <h1 className="text-4xl font-bold leading-tight mb-4">
            Replique operações<br />com precisão.
          </h1>
          <p className="text-white/70 text-base max-w-sm leading-relaxed">
            Conecte sua conta Bull-ex e deixe o sistema copiar automaticamente para todos os seus seguidores em tempo real.
          </p>

          <div className="mt-8 flex flex-col gap-2">
            {['Atualização em tempo real', 'Contas de seguidores isoladas', 'Stop Win / Stop Loss automático', 'Portal para os seus seguidores'].map((f) => (
              <div key={f} className="flex items-center gap-2.5 text-sm text-white/80">
                <ChevronRight className="w-4 h-4 text-white/50" />
                {f}
              </div>
            ))}
          </div>
        </div>

        <p className="relative text-white/40 text-xs">
          Integração com a corretora Bull-ex
        </p>
      </div>

      <div className="flex-1 flex items-center justify-center p-6 relative">
        <button type="button" onClick={toggle} className="absolute top-5 right-5 w-9 h-9 rounded-xl btn-icon" title="Alternar tema">
          {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        <div className="w-full max-w-sm">
          <div className="flex lg:hidden items-center gap-2.5 mb-8">
            <div className="w-9 h-9 rounded-xl bg-brand-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-white" />
            </div>
            <span className="text-base font-bold text-[var(--text-1)]">CopyTrader</span>
          </div>

          <h2 className="text-2xl font-bold text-[var(--text-1)] mb-1">Entrar</h2>
          <p className="text-sm text-[var(--text-3)] mb-8">
            Painel do operador (master). Contas são criadas pelo administrador da plataforma.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-[var(--text-2)] mb-1.5">Email</label>
              <input
                type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com" required
                className="field w-full"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--text-2)] mb-1.5">Senha</label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'} value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required minLength={1}
                  className="field w-full pr-10"
                />
                <button
                  type="button" onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-3)] hover:text-[var(--text-2)] transition-colors"
                >
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit" disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold rounded-xl px-4 py-3 transition-all disabled:opacity-60 disabled:cursor-not-allowed mt-2"
            >
              {loading ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Entrar
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="divider my-6" />
          <div className="space-y-3 text-center text-sm">
            <p className="text-[var(--text-3)]">
              <Link to="/admin/login" className="inline-flex items-center justify-center gap-2 text-violet-600 dark:text-violet-400 font-semibold hover:underline">
                <Shield className="w-4 h-4" /> Super admin — gerir contas master
              </Link>
            </p>
            <p className="text-[var(--text-3)]">
              Seguidores?{' '}
              <a href="/portal" className="text-brand-600 dark:text-brand-400 hover:underline font-medium">
                Acesse o portal
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

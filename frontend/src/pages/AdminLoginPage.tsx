import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Shield, Moon, Sun, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { authApi, tokenStore } from '../services/api';
import { useTheme } from '../hooks/useTheme';
import toast from 'react-hot-toast';

export default function AdminLoginPage() {
  const navigate = useNavigate();
  const { isDark, toggle } = useTheme();
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [showPw,   setShowPw]   = useState(false);
  const [loading,  setLoading]  = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await authApi.login(email, password);
      if (data.user?.role !== 'ADMIN') {
        toast.error('Esta conta não é super admin.');
        return;
      }
      tokenStore.setTokens(data.accessToken, data.refreshToken);
      tokenStore.setUser(data.user);
      toast.success(`Bem-vindo, ${data.user.name}`);
      navigate('/admin', { replace: true });
    } catch (err: any) {
      toast.error(err.response?.data?.error ?? err.message ?? 'Erro ao entrar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-[var(--bg)]">
      <div className="hidden lg:flex lg:w-[45%] bg-slate-900 relative overflow-hidden flex-col justify-between p-10 text-white">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-900/40 to-slate-900" />
        <div className="relative flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-violet-500 flex items-center justify-center">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <span className="text-lg font-bold tracking-tight">CopyTrader — Super Admin</span>
        </div>
        <div className="relative">
          <h1 className="text-3xl font-bold leading-tight mb-3">Gestão de contas master</h1>
          <p className="text-white/65 text-sm max-w-xs leading-relaxed">
            Crie e gerencie os operadores que acessam o painel de copy trading. O cadastro público está desativado.
          </p>
        </div>
        <p className="relative text-white/35 text-xs">Acesso restrito</p>
      </div>

      <div className="flex-1 flex items-center justify-center p-6 relative">
        <button type="button" onClick={toggle} className="absolute top-5 right-5 w-9 h-9 rounded-xl btn-icon" title="Tema">
          {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        <div className="w-full max-w-sm">
          <div className="flex lg:hidden items-center gap-2.5 mb-8">
            <div className="w-9 h-9 rounded-xl bg-violet-600 flex items-center justify-center">
              <Shield className="w-4 h-4 text-white" />
            </div>
            <span className="text-base font-bold text-[var(--text-1)]">Super Admin</span>
          </div>

          <h2 className="text-2xl font-bold text-[var(--text-1)] mb-1">Entrar</h2>
          <p className="text-sm text-[var(--text-3)] mb-8">Credenciais do administrador da plataforma</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-[var(--text-2)] mb-1.5">Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="field w-full" placeholder="admin@empresa.com" />
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--text-2)] mb-1.5">Senha</label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="field w-full pr-10"
                  placeholder="••••••••"
                />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-3)]">
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold rounded-xl px-4 py-3 transition-all disabled:opacity-60"
            >
              {loading ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><span>Entrar</span><ArrowRight className="w-4 h-4" /></>}
            </button>
          </form>

          <p className="text-center text-sm text-[var(--text-3)] mt-8">
            <Link to="/login" className="text-violet-600 dark:text-violet-400 font-semibold hover:underline">Painel master (operador)</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

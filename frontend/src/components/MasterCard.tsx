import { useState } from 'react';
import { Power, RefreshCw, Play, Pause, Crown, Loader2, Wallet, Link2, TrendingUp } from 'lucide-react';
import toast from 'react-hot-toast';
import { accountsApi } from '../services/api.js';
import { AccountInfo } from '../types/index.js';

interface MasterCardProps {
  account: AccountInfo | null;
  copyRunning: boolean;
  onDisconnect: () => void;
  onCopyToggle: (running: boolean) => void;
  onBalanceRefresh: (bal: Partial<AccountInfo>) => void;
  onConnectRequest?: () => void;
}

export default function MasterCard({ account, copyRunning, onDisconnect, onCopyToggle, onBalanceRefresh, onConnectRequest }: MasterCardProps) {
  const [refreshing, setRefreshing] = useState(false);
  const [toggling,   setToggling]   = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const data = await accountsApi.getStatus();
      if (data.master) onBalanceRefresh(data.master);
    }
    catch { toast.error('Erro ao atualizar saldo'); }
    finally { setRefreshing(false); }
  };

  const handleToggle = async () => {
    setToggling(true);
    try {
      if (copyRunning) {
        await accountsApi.stopCopy();
        onCopyToggle(false);
        toast('Cópia pausada', { icon: '⏸' });
      } else {
        await accountsApi.startCopy();
        onCopyToggle(true);
        toast.success('CopyFy em execução — cópia iniciada!');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Erro ao controlar copy');
    } finally {
      setToggling(false);
    }
  };

  const handleDisconnect = async () => {
    try { await accountsApi.disconnectMaster(); onDisconnect(); toast('Desconectado', { icon: '👋' }); }
    catch { toast.error('Erro ao desconectar'); }
  };

  if (!account) {
    return (
      <div className="card overflow-hidden">
        <div className="relative p-5 overflow-hidden" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)' }}>
          <div className="absolute inset-0 opacity-10"
            style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.06) 1.5px, transparent 1.5px)', backgroundSize: '24px 24px' }} />
          <div className="relative z-10 text-center py-3">
            <div className="w-12 h-12 rounded-2xl bg-white/8 flex items-center justify-center mx-auto mb-3">
              <TrendingUp className="w-6 h-6 text-gray-400" />
            </div>
            <p className="text-white font-semibold text-sm mb-0.5">Conta Bullex não conectada</p>
            <p className="text-gray-500 text-xs">Conecte sua conta da corretora para iniciar o copy trading</p>
          </div>
        </div>
        <div className="p-4">
          <button onClick={onConnectRequest}
            className="btn-brand w-full">
            <Link2 className="w-4 h-4" />
            Conectar conta Bullex
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl overflow-hidden border border-c shadow-card">
      {/* Dark hero header */}
      <div className="relative p-5 overflow-hidden bg-sidebar">
        <div className="absolute inset-0" style={{
          background: 'radial-gradient(ellipse at 80% 20%, rgba(132,204,22,0.18) 0%, transparent 60%)',
        }} />
        <div className="absolute inset-0 opacity-20" style={{
          backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.06) 1.5px, transparent 1.5px)',
          backgroundSize: '24px 24px',
        }} />

        <div className="relative z-10">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-brand-gradient flex items-center justify-center shadow-glow-brand">
                <Crown className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-white font-semibold text-sm leading-tight">{account.name}</p>
                <p className="text-gray-400 text-xs truncate max-w-[160px]">{account.email}</p>
              </div>
            </div>
            <div className="flex gap-1.5">
              <button onClick={handleRefresh} disabled={refreshing}
                className="w-7 h-7 rounded-lg bg-white/8 hover:bg-white/15 text-gray-400 hover:text-white flex items-center justify-center transition-all"
                title="Atualizar saldo">
                <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              </button>
              <button onClick={handleDisconnect}
                className="w-7 h-7 rounded-lg bg-red-500/12 hover:bg-red-500/25 text-red-400 flex items-center justify-center transition-all"
                title="Desconectar">
                <Power className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <p className="text-gray-500 text-[10px] uppercase tracking-widest mb-1 flex items-center gap-1">
            <Wallet className="w-3 h-3" /> Saldo Real
          </p>
          <p className="num text-2xl font-bold text-white tracking-tight">
            {account.currency} {account.balanceReal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
          <p className="num text-sm text-gray-500 mt-1">
            Demo: {account.currency} {account.balanceDemo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
        </div>
      </div>

      {/* Footer with controls */}
      <div className="bg-surface p-4 space-y-2">
        <button onClick={handleToggle} disabled={toggling}
          className={`w-full py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all ${
            copyRunning
              ? 'bg-surface2 border border-c text-c2 hover:text-c1'
              : 'btn-brand'
          }`}>
          {toggling ? <Loader2 className="w-4 h-4 animate-spin" />
                    : copyRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          {copyRunning ? 'Pausar cópia' : 'Iniciar cópia'}
        </button>

        {copyRunning && (
          <div className="flex items-center justify-center gap-2 pt-0.5">
            <span className="w-2 h-2 rounded-full bg-brand-500 animate-pulse-dot" />
            <span className="text-xs text-brand-600 dark:text-brand-400 font-medium">Copiando em tempo real</span>
          </div>
        )}
      </div>
    </div>
  );
}

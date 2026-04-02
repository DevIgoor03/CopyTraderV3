import { useState } from 'react';
import { X, Save, Loader2, Edit3, Wallet, TrendingUp, TrendingDown, Sliders } from 'lucide-react';
import toast from 'react-hot-toast';
import { accountsApi } from '../services/api.js';
import { CopySettings, FollowerAccount } from '../types/index.js';

interface Props {
  follower: FollowerAccount;
  onClose: () => void;
  onSaved: (follower: FollowerAccount) => void;
}

const modeOptions = [
  { value: 'fixed',        label: 'Valor Fixo',      desc: 'Valor em USD por operação',       icon: '💵' },
  { value: 'multiplier',   label: 'Multiplicador',   desc: 'Múltiplo do valor do master',     icon: '📊' },
  { value: 'proportional', label: '% do Saldo',      desc: 'Porcentagem do seu saldo atual',  icon: '📈' },
] as const;

export default function EditFollowerModal({ follower, onClose, onSaved }: Props) {
  const cs = follower.copySettings;
  const [loading, setLoading] = useState(false);
  const [cfg, setCfg] = useState<Partial<CopySettings>>({
    mode:        cs.mode,
    amount:      cs.amount,
    accountType: cs.accountType,
    stopWin:     cs.stopWin,
    stopLoss:    cs.stopLoss,
  });

  const set = <K extends keyof CopySettings>(k: K, v: CopySettings[K]) =>
    setCfg((p) => ({ ...p, [k]: v }));

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await accountsApi.updateFollower(follower.id, cfg);
      toast.success('Configurações salvas!');
      onSaved(data ?? { ...follower, copySettings: { ...follower.copySettings, ...cfg } });
      onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Erro ao salvar');
    } finally {
      setLoading(false);
    }
  };

  const initials = follower.name.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase();
  const balanceLabel = cs.accountType === 'real'
    ? `BRL ${follower.balanceReal.toFixed(2)}`
    : `BRL ${follower.balanceDemo.toFixed(2)}`;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
      <div
        className="bg-surface rounded-2xl w-full max-w-[460px] shadow-modal border border-c animate-slide-up overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative bg-sidebar overflow-hidden">
          <div className="absolute inset-0 opacity-20"
            style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.07) 1.5px, transparent 1.5px)', backgroundSize: '24px 24px' }} />
          <div className="absolute top-0 right-0 w-48 h-48 bg-brand-500/10 rounded-full blur-[60px] pointer-events-none" />

          <div className="relative z-10 px-6 py-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-gray-400 text-xs">
                <Edit3 className="w-3.5 h-3.5" />
                Editar configurações
              </div>
              <button onClick={onClose}
                className="w-7 h-7 rounded-lg bg-white/8 hover:bg-white/15 text-gray-400 hover:text-white flex items-center justify-center transition-all">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-full bg-brand-gradient flex items-center justify-center text-sm font-bold text-white shadow-glow-brand flex-shrink-0">
                {initials}
              </div>
              <div className="min-w-0">
                <p className="text-white font-bold text-base truncate">{follower.name}</p>
                <p className="text-gray-400 text-xs truncate">{follower.email}</p>
              </div>
            </div>

            {/* Quick balance row */}
            <div className="grid grid-cols-2 gap-2 mt-4">
              <div className="bg-white/5 border border-white/8 rounded-xl px-3 py-2">
                <p className="text-gray-500 text-[10px] mb-0.5">Real</p>
                <p className="num text-white text-xs font-semibold">{follower.currency} {follower.balanceReal.toFixed(2)}</p>
              </div>
              <div className="bg-white/5 border border-white/8 rounded-xl px-3 py-2">
                <p className="text-gray-500 text-[10px] mb-0.5">Demo</p>
                <p className="num text-white text-xs font-semibold">{follower.currency} {follower.balanceDemo.toFixed(2)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSave} className="px-6 py-5 space-y-5">

          {/* Account type */}
          <div>
            <label className="label flex items-center gap-1.5">
              <Wallet className="w-3.5 h-3.5" /> Conta para copiar
            </label>
            <div className="grid grid-cols-2 gap-2">
              {(['demo', 'real'] as const).map((t) => (
                <button key={t} type="button" onClick={() => set('accountType', t)}
                  className={`py-3 rounded-xl text-sm font-semibold border-2 transition-all flex items-center justify-center gap-2 ${
                    cfg.accountType === t
                      ? t === 'demo'
                        ? 'bg-blue-50 dark:bg-blue-500/15 border-blue-400 dark:border-blue-500/50 text-blue-700 dark:text-blue-400'
                        : 'bg-brand-50 dark:bg-brand-500/15 border-brand-400 dark:border-brand-500/50 text-brand-700 dark:text-brand-400'
                      : 'bg-surface2 border-c text-c3 hover:text-c2 hover:border-c/60'
                  }`}>
                  {t === 'demo' ? '🎯' : '💰'} {t === 'demo' ? 'Demo' : 'Real'}
                </button>
              ))}
            </div>
          </div>

          {/* Mode */}
          <div>
            <label className="label flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5" /> Modo de cópia
            </label>
            <div className="space-y-2">
              {modeOptions.map(({ value, label, desc, icon }) => (
                <button key={value} type="button" onClick={() => set('mode', value)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all text-left ${
                    cfg.mode === value
                      ? 'bg-brand-50 dark:bg-brand-500/12 border-brand-400 dark:border-brand-500/50'
                      : 'bg-surface2 border-c hover:border-c/60'
                  }`}>
                  <span className="text-lg flex-shrink-0">{icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-semibold ${cfg.mode === value ? 'text-brand-700 dark:text-brand-400' : 'text-c1'}`}>
                      {label}
                    </p>
                    <p className="text-xs text-c3">{desc}</p>
                  </div>
                  <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 ${
                    cfg.mode === value
                      ? 'border-brand-500 bg-brand-500'
                      : 'border-c'
                  }`}>
                    {cfg.mode === value && <div className="w-full h-full rounded-full flex items-center justify-center">
                      <div className="w-1.5 h-1.5 rounded-full bg-white" />
                    </div>}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Amount */}
          <div>
            <label className="label">
              {cfg.mode === 'fixed' ? 'Valor por operação (USD)' : cfg.mode === 'multiplier' ? 'Multiplicador (ex: 2 = 2x)' : 'Porcentagem do saldo (%)'}
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-c3 text-sm font-medium">
                {cfg.mode === 'fixed' ? '$' : '%'}
              </span>
              <input
                type="number" value={cfg.amount ?? ''} min={0} step="any"
                onChange={(e) => set('amount', parseFloat(e.target.value) || 0)}
                className="field pl-8" disabled={loading}
              />
            </div>
          </div>

          {/* Stop win/loss */}
          <div>
            <label className="label">Gestão de risco (opcional)</label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="flex items-center gap-1.5 mb-1.5">
                  <TrendingUp className="w-3.5 h-3.5 text-brand-500" />
                  <span className="text-xs font-semibold text-brand-600 dark:text-brand-400">Stop Win</span>
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-c3 text-xs">$</span>
                  <input
                    type="number" placeholder="Sem limite" min={0} step="any"
                    value={cfg.stopWin ?? ''}
                    onChange={(e) => set('stopWin', e.target.value ? parseFloat(e.target.value) : null)}
                    className="field pl-6 text-sm" disabled={loading}
                  />
                </div>
              </div>
              <div>
                <div className="flex items-center gap-1.5 mb-1.5">
                  <TrendingDown className="w-3.5 h-3.5 text-red-500" />
                  <span className="text-xs font-semibold text-red-500 dark:text-red-400">Stop Loss</span>
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-c3 text-xs">$</span>
                  <input
                    type="number" placeholder="Sem limite" min={0} step="any"
                    value={cfg.stopLoss ?? ''}
                    onChange={(e) => set('stopLoss', e.target.value ? parseFloat(e.target.value) : null)}
                    className="field pl-6 text-sm" disabled={loading}
                  />
                </div>
              </div>
            </div>
            {(cfg.stopWin || cfg.stopLoss) && (
              <p className="text-xs text-c3 mt-2 flex items-center gap-1.5">
                <span className="w-1 h-1 rounded-full bg-brand-400" />
                O copytrader pausa automaticamente ao atingir os limites
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-2.5 pt-1">
            <button type="button" onClick={onClose} disabled={loading} className="btn-white flex-1 py-3">
              Cancelar
            </button>
            <button type="submit" disabled={loading} className="btn-brand flex-1 py-3">
              {loading
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Salvando...</>
                : <><Save className="w-4 h-4" /> Salvar</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

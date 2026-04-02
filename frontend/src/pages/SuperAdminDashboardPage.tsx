import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Shield, LogOut, Users, Plus, Trash2, KeyRound, RefreshCw, Mail, User, Moon, Sun, BarChart3, Link2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { adminApi, authApi, tokenStore, type CopyPlanTier } from '../services/api';
import { useTheme } from '../hooks/useTheme';

interface PlanPublicSpec {
  id: CopyPlanTier;
  name: string;
  emoji: string;
  priceBrlPerUser: number;
  suggestedLimitLabel: string;
  maxFollowers: number | null;
  copyWaveDelayMs: number;
  followersPerWave: number;
  initialCopyDelayMs: number;
  optimizedCopy: boolean;
  priorityServer: boolean;
  vipSupport: boolean;
  earlyAccess: boolean;
  features: string[];
}

interface MasterPlanRow {
  tier: CopyPlanTier;
  name: string;
  emoji: string;
  priceBrlPerUser: number;
  suggestedLimitLabel: string;
  maxFollowers: number | null;
  followerCount: number;
  followerSlotsRemaining: number | null;
  features: string[];
  optimizedCopy: boolean;
  priorityServer: boolean;
  vipSupport: boolean;
}

interface MasterRow {
  id: string;
  email: string;
  name: string;
  createdAt: string;
  subscriptionPlan?: CopyPlanTier;
  portalSlug?: string | null;
  plan?: MasterPlanRow;
  masterAccount: null | {
    id: string;
    bullexEmail: string;
    isConnected: boolean;
    copyRunning: boolean;
    balanceReal: number;
    balanceDemo: number;
    currency: string;
    followerCount: number;
    tradeCount: number;
  };
}

const PLAN_ORDER: CopyPlanTier[] = ['START', 'PRO', 'ELITE'];

export default function SuperAdminDashboardPage() {
  const navigate = useNavigate();
  const { isDark, toggle } = useTheme();
  const [masters, setMasters] = useState<MasterRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [createEmail, setCreateEmail] = useState('');
  const [createName, setCreateName] = useState('');
  const [createPw, setCreatePw] = useState('');
  const [createPlan, setCreatePlan] = useState<CopyPlanTier>('START');
  const [createBusy, setCreateBusy] = useState(false);

  const [catalog, setCatalog] = useState<PlanPublicSpec[]>([]);
  const [planBusyId, setPlanBusyId] = useState<string | null>(null);
  const [slugDraft, setSlugDraft] = useState<Record<string, string>>({});
  const [slugSavingId, setSlugSavingId] = useState<string | null>(null);

  const [resetUserId, setResetUserId] = useState<string | null>(null);
  const [newPw, setNewPw] = useState('');
  const [resetBusy, setResetBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [data, plansData] = await Promise.all([
        adminApi.listMasters(),
        adminApi.listPlans().catch(() => ({ plans: [] as PlanPublicSpec[] })),
      ]);
      const list = data.masters ?? [];
      setMasters(list);
      setSlugDraft(Object.fromEntries(list.map((m: MasterRow) => [m.id, m.portalSlug ?? ''])));
      if (plansData.plans?.length) setCatalog(plansData.plans);
    } catch (err: any) {
      toast.error(err.response?.data?.error ?? 'Erro ao carregar masters');
      if (err.response?.status === 401 || err.response?.status === 403) {
        tokenStore.clearTokens();
        navigate('/admin/login', { replace: true });
      }
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => { load(); }, [load]);

  const user = tokenStore.getUser();

  const handleLogout = () => {
    const refresh = tokenStore.getRefresh();
    if (refresh) authApi.logout(refresh).catch(() => {});
    tokenStore.clearTokens();
    navigate('/admin/login', { replace: true });
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateBusy(true);
    try {
      await adminApi.createMaster(createEmail.trim(), createPw, createName.trim(), createPlan);
      toast.success('Conta master criada. O operador pode entrar em /login');
      setShowCreate(false);
      setCreateEmail('');
      setCreateName('');
      setCreatePw('');
      setCreatePlan('START');
      await load();
    } catch (err: any) {
      toast.error(err.response?.data?.error ?? 'Falha ao criar');
    } finally {
      setCreateBusy(false);
    }
  };

  const handleDelete = async (row: MasterRow) => {
    if (!window.confirm(`Excluir permanentemente "${row.name}" (${row.email})? Isso remove seguidores e histórico associados.`)) return;
    try {
      await adminApi.deleteMaster(row.id);
      toast.success('Conta removida');
      await load();
    } catch (err: any) {
      toast.error(err.response?.data?.error ?? 'Falha ao excluir');
    }
  };

  const savePortalSlug = async (userId: string) => {
    const raw = (slugDraft[userId] ?? '').trim();
    setSlugSavingId(userId);
    try {
      await adminApi.updateMasterPortalSlug(userId, raw === '' ? null : raw);
      toast.success(raw ? 'Identificador do portal salvo' : 'Removido — o operador pode usar o link com ID interno');
      await load();
    } catch (err: any) {
      toast.error(err.response?.data?.error ?? 'Falha ao salvar o link');
    } finally {
      setSlugSavingId(null);
    }
  };

  const handlePlanChange = async (userId: string, tier: CopyPlanTier) => {
    setPlanBusyId(userId);
    try {
      await adminApi.updateMasterPlan(userId, tier);
      toast.success(`Plano alterado para ${tier}`);
      await load();
    } catch (err: any) {
      toast.error(err.response?.data?.error ?? 'Falha ao alterar plano');
    } finally {
      setPlanBusyId(null);
    }
  };

  const handleResetPw = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetUserId) return;
    setResetBusy(true);
    try {
      await adminApi.resetMasterPassword(resetUserId, newPw);
      toast.success('Senha atualizada. O operador precisa entrar de novo.');
      setResetUserId(null);
      setNewPw('');
    } catch (err: any) {
      toast.error(err.response?.data?.error ?? 'Falha ao alterar senha');
    } finally {
      setResetBusy(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg)]">
      <header className="flex-shrink-0 h-14 bg-[var(--surface)] border-b border-[var(--border)] flex items-center justify-between px-6">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-violet-600 flex items-center justify-center flex-shrink-0">
            <Shield className="w-4 h-4 text-white" />
          </div>
          <div className="min-w-0">
            <h1 className="text-[var(--text-1)] font-bold text-sm truncate">Super Admin</h1>
            <p className="text-[var(--text-3)] text-xs truncate">Contas master da plataforma</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-xs text-[var(--text-3)] hidden sm:inline truncate max-w-[140px]">{user?.email}</span>
          <button type="button" onClick={toggle} className="btn-icon" title="Tema">
            {isDark ? <Sun className="w-4 h-4 text-yellow-400" /> : <Moon className="w-4 h-4" />}
          </button>
          <button type="button" onClick={load} className="btn-icon" title="Atualizar"><RefreshCw className="w-4 h-4" /></button>
          <button type="button" onClick={handleLogout} className="flex items-center gap-1.5 text-xs font-semibold text-red-500 hover:bg-red-500/10 px-3 py-2 rounded-xl">
            <LogOut className="w-3.5 h-3.5" /> Sair
          </button>
        </div>
      </header>

      <main className="flex-1 p-5 max-w-6xl mx-auto w-full space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-extrabold text-[var(--text-1)]">Operadores (masters)</h2>
            <p className="text-sm text-[var(--text-2)] mt-0.5">
              {masters.length} conta(s). Cada uma acessa o painel em <span className="font-mono text-brand-600 dark:text-brand-400">/login</span> e conecta a Bullex depois.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold rounded-xl px-4 py-2.5"
          >
            <Plus className="w-4 h-4" /> Nova conta master
          </button>
        </div>

        {catalog.length > 0 && (
          <div className="card p-5 space-y-3">
            <h3 className="text-sm font-bold text-[var(--text-1)] flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-violet-500" /> Catálogo de planos
            </h3>
            <div className="grid sm:grid-cols-3 gap-3">
              {catalog.map((p) => (
                <div
                  key={p.id}
                  className="rounded-xl border border-[var(--border)] bg-[var(--bg)] p-4 text-sm"
                >
                  <p className="font-bold text-[var(--text-1)]">
                    {p.emoji} {p.name}{' '}
                    <span className="text-[var(--text-3)] font-normal">R$ {p.priceBrlPerUser}/mês</span>
                  </p>
                  <p className="text-xs text-[var(--text-3)] mt-1">{p.suggestedLimitLabel}</p>
                  <ul className="mt-2 space-y-1 text-xs text-[var(--text-2)] list-disc list-inside">
                    {p.features.slice(0, 4).map((f) => (
                      <li key={f}>{f}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="card overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-[var(--text-3)] text-sm">Carregando…</div>
          ) : masters.length === 0 ? (
            <div className="p-12 text-center">
              <Users className="w-10 h-10 text-[var(--text-3)] mx-auto mb-3" />
              <p className="text-[var(--text-1)] font-semibold mb-1">Nenhuma conta master</p>
              <p className="text-sm text-[var(--text-3)] mb-4">Crie a primeira para liberar o login dos operadores.</p>
              <button type="button" onClick={() => setShowCreate(true)} className="btn-brand px-5 py-2.5 text-sm">Criar conta master</button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--border)] bg-[var(--bg)]">
                    <th className="text-left font-semibold text-[var(--text-2)] px-4 py-3">Operador</th>
                    <th className="text-left font-semibold text-[var(--text-2)] px-4 py-3">
                      <span className="inline-flex items-center gap-1"><Link2 className="w-3.5 h-3.5" /> Portal</span>
                    </th>
                    <th className="text-left font-semibold text-[var(--text-2)] px-4 py-3">Plano</th>
                    <th className="text-left font-semibold text-[var(--text-2)] px-4 py-3">Bullex (painel)</th>
                    <th className="text-left font-semibold text-[var(--text-2)] px-4 py-3">Seguidores</th>
                    <th className="text-left font-semibold text-[var(--text-2)] px-4 py-3">Trades</th>
                    <th className="text-left font-semibold text-[var(--text-2)] px-4 py-3">Status</th>
                    <th className="text-right font-semibold text-[var(--text-2)] px-4 py-3">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {masters.map((m) => (
                    <tr key={m.id} className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--bg)]/80">
                      <td className="px-4 py-3">
                        <p className="font-semibold text-[var(--text-1)]">{m.name}</p>
                        <p className="text-xs text-[var(--text-3)] flex items-center gap-1 mt-0.5"><Mail className="w-3 h-3" />{m.email}</p>
                      </td>
                      <td className="px-4 py-3 align-top max-w-[200px]">
                        <p className="text-[10px] text-[var(--text-3)] font-mono truncate mb-1" title="/portal/…">
                          /portal/
                          <span className="text-[var(--text-2)]">{slugDraft[m.id]?.trim() || m.portalSlug || '…'}</span>
                        </p>
                        <div className="flex gap-1">
                          <input
                            className="field text-xs py-1 flex-1 min-w-0"
                            placeholder="ex: copyhelio123"
                            value={slugDraft[m.id] ?? ''}
                            onChange={(e) => setSlugDraft((d) => ({ ...d, [m.id]: e.target.value }))}
                          />
                          <button
                            type="button"
                            disabled={slugSavingId === m.id}
                            onClick={() => { void savePortalSlug(m.id); }}
                            className="flex-shrink-0 px-2 py-1 rounded-lg text-xs font-semibold bg-violet-600 text-white disabled:opacity-50"
                          >
                            OK
                          </button>
                        </div>
                      </td>
                      <td className="px-4 py-3 align-top">
                        <div className="space-y-1.5">
                          <p className="text-xs font-semibold text-[var(--text-1)]">
                            {m.plan?.emoji ?? '🟢'} {m.plan?.name ?? m.subscriptionPlan ?? 'START'}
                          </p>
                          <p className="text-[10px] text-[var(--text-3)] leading-tight">
                            {m.plan?.maxFollowers == null
                              ? `${m.plan?.followerCount ?? m.masterAccount?.followerCount ?? 0} seguidores (ilimitado)`
                              : `${m.plan?.followerCount ?? m.masterAccount?.followerCount ?? 0} / ${m.plan.maxFollowers} slots`}
                          </p>
                          <select
                            className="field text-xs py-1 max-w-[9rem]"
                            value={m.subscriptionPlan ?? 'START'}
                            disabled={planBusyId === m.id}
                            onChange={(e) => {
                              const v = e.target.value as CopyPlanTier;
                              if (v === (m.subscriptionPlan ?? 'START')) return;
                              void handlePlanChange(m.id, v);
                            }}
                          >
                            {PLAN_ORDER.map((id) => (
                              <option key={id} value={id}>{id}</option>
                            ))}
                          </select>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-[var(--text-2)]">
                        {m.masterAccount ? (
                          <span className="text-xs font-mono">{m.masterAccount.bullexEmail}</span>
                        ) : (
                          <span className="text-[var(--text-3)] text-xs">Ainda não conectou Bullex</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-[var(--text-1)]">{m.masterAccount?.followerCount ?? 0}</td>
                      <td className="px-4 py-3 text-[var(--text-1)] tabular-nums">{m.masterAccount?.tradeCount ?? 0}</td>
                      <td className="px-4 py-3">
                        {!m.masterAccount ? (
                          <span className="text-xs text-amber-600 dark:text-amber-400 font-medium">Só login criado</span>
                        ) : (
                          <div className="flex flex-col gap-0.5">
                            <span className={m.masterAccount.isConnected ? 'text-xs text-emerald-600 dark:text-emerald-400 font-medium' : 'text-xs text-[var(--text-3)]'}>
                              {m.masterAccount.isConnected ? 'Corretora OK' : 'Desconectado'}
                            </span>
                            {m.masterAccount.copyRunning && (
                              <span className="text-[10px] text-violet-600 dark:text-violet-400 font-medium">Copy ativo</span>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-1 flex-wrap">
                          <button
                            type="button"
                            onClick={() => { setResetUserId(m.id); setNewPw(''); }}
                            className="p-2 rounded-lg border border-[var(--border)] hover:border-violet-500/40 text-[var(--text-2)]"
                            title="Redefinir senha do painel"
                          >
                            <KeyRound className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(m)}
                            className="p-2 rounded-lg border border-[var(--border)] hover:border-red-500/40 text-red-500"
                            title="Excluir conta"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-sm">
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4">
            <h3 className="text-lg font-bold text-[var(--text-1)] flex items-center gap-2"><User className="w-5 h-5 text-violet-500" /> Nova conta master</h3>
            <p className="text-xs text-[var(--text-3)]">O operador usará estes dados em <strong>/login</strong> (painel master). A conexão Bullex ele faz depois no dashboard.</p>
            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-[var(--text-2)] mb-1">Nome</label>
                <input className="field w-full" value={createName} onChange={(e) => setCreateName(e.target.value)} required minLength={2} placeholder="Nome do operador" />
              </div>
              <div>
                <label className="block text-xs font-medium text-[var(--text-2)] mb-1">Email (login)</label>
                <input type="email" className="field w-full" value={createEmail} onChange={(e) => setCreateEmail(e.target.value)} required />
              </div>
              <div>
                <label className="block text-xs font-medium text-[var(--text-2)] mb-1">Senha (mín. 8)</label>
                <input type="password" className="field w-full" value={createPw} onChange={(e) => setCreatePw(e.target.value)} required minLength={8} />
              </div>
              <div>
                <label className="block text-xs font-medium text-[var(--text-2)] mb-1">Plano inicial</label>
                <select
                  className="field w-full text-sm"
                  value={createPlan}
                  onChange={(e) => setCreatePlan(e.target.value as CopyPlanTier)}
                >
                  {PLAN_ORDER.map((id) => (
                    <option key={id} value={id}>{id}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setShowCreate(false)} className="flex-1 py-2.5 rounded-xl border border-[var(--border)] text-sm font-semibold text-[var(--text-2)]">Cancelar</button>
                <button type="submit" disabled={createBusy} className="flex-1 py-2.5 rounded-xl bg-violet-600 text-white text-sm font-semibold disabled:opacity-60">Criar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {resetUserId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-sm">
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4">
            <h3 className="text-lg font-bold text-[var(--text-1)] flex items-center gap-2"><KeyRound className="w-5 h-5 text-violet-500" /> Nova senha do painel</h3>
            <form onSubmit={handleResetPw} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-[var(--text-2)] mb-1">Nova senha (mín. 8)</label>
                <input type="password" className="field w-full" value={newPw} onChange={(e) => setNewPw(e.target.value)} required minLength={8} />
              </div>
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => { setResetUserId(null); setNewPw(''); }} className="flex-1 py-2.5 rounded-xl border border-[var(--border)] text-sm font-semibold">Cancelar</button>
                <button type="submit" disabled={resetBusy} className="flex-1 py-2.5 rounded-xl bg-violet-600 text-white text-sm font-semibold disabled:opacity-60">Salvar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

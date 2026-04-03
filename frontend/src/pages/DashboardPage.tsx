import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users, TrendingUp, Activity, DollarSign, UserPlus,
  BarChart2, Bell, Settings, ExternalLink, Moon, Sun, Link2, Copy, LogOut, AlertTriangle,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useSocket }    from '../hooks/useSocket.js';
import { useTheme }     from '../hooks/useTheme.js';
import { accountsApi, tokenStore, tradesApi } from '../services/api.js';
import Sidebar          from '../components/Sidebar.js';
import StatCard         from '../components/StatCard.js';
import MasterCard       from '../components/MasterCard.js';
import FollowerCard     from '../components/FollowerCard.js';
import FollowerMiniCard from '../components/FollowerMiniCard.js';
import TradeHistory     from '../components/TradeHistory.js';
import AddFollowerModal from '../components/AddFollowerModal.js';
import ConnectMasterModal from '../components/ConnectMasterModal.js';
import { AccountInfo, FollowerAccount, TradeRecord } from '../types/index.js';

export default function DashboardPage() {
  const navigate          = useNavigate();
  const { isDark, toggle } = useTheme();

  const [activePage,    setActivePage]    = useState('dashboard');
  const [showAddModal,  setShowAddModal]  = useState(false);
  const [showConnect,   setShowConnect]   = useState(false);
  const [master,        setMaster]        = useState<AccountInfo | null>(null);
  const [bullexConnected,  setBullexConnected]  = useState(false);
  const [followers,     setFollowers]     = useState<FollowerAccount[]>([]);
  const [trades,        setTrades]        = useState<TradeRecord[]>([]);
  const [copyRunning,   setCopyRunning]   = useState(false);
  const [connected,     setConnected]     = useState(false);
  const [loading,       setLoading]       = useState(true);
  const [nowTick,       setNowTick]       = useState(Date.now());
  const [portalPath,    setPortalPath]    = useState<string | null>(null);

  // ─── Load initial state ───────────────────────────────────────────────────────

  const loadStatus = useCallback(async () => {
    try {
      const data = await accountsApi.getStatus();
      setMaster(data.master ?? null);
      setBullexConnected(data.sdkConnected ?? false);
      setFollowers(data.followers ?? []);
      setTrades(data.trades ?? []);
      setCopyRunning(data.copyRunning ?? false);
      setPortalPath(data.portalPath ?? null);
      // Always force the connect modal whenever the master is not connected.
      // User explicitly requested this behavior.
      if (!data.master || !data.sdkConnected) setShowConnect(true);
    } catch (err: any) {
      if (err.response?.status === 401) {
        tokenStore.clearTokens();
        navigate('/login', { replace: true });
      }
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => { loadStatus(); }, [loadStatus]);
  useEffect(() => {
    const id = window.setInterval(() => setNowTick(Date.now()), 60_000);
    return () => window.clearInterval(id);
  }, []);

  // ─── Socket.IO real-time ──────────────────────────────────────────────────────

  const handleSocketEvent = useCallback((event: string, data: any) => {
    switch (event) {
      case 'connect':    setConnected(true);  break;
      case 'disconnect': setConnected(false); break;
      case 'master:balance':
        setMaster((m) => m ? { ...m, ...data } : m);
        break;
      case 'follower:updated':
        setFollowers((prev) => {
          const idx = prev.findIndex((f) => f.id === data.id);
          return idx >= 0 ? [...prev.slice(0, idx), data, ...prev.slice(idx + 1)] : [...prev, data];
        });
        break;
      case 'follower:removed':
        setFollowers((prev) => prev.filter((f) => f.id !== data.followerId));
        break;
      case 'follower:stopped': {
        const reason = data.reason === 'stopWin' ? 'Stop Win atingido' : 'Stop Loss atingido';
        toast(`${reason} — seguidor pausado`, { icon: data.reason === 'stopWin' ? '🎯' : '🛑' });
        break;
      }
      case 'trade:new':
        setTrades((prev) => [data, ...prev].slice(0, 200));
        break;
      case 'trade:updated':
        setTrades((prev) => prev.map((t) => t.id === data.id ? { ...t, ...data } : t));
        break;
      case 'copy:started': setCopyRunning(true);  break;
      case 'copy:stopped': setCopyRunning(false); break;
      case 'copy:error':
        toast.error(`Erro na cópia: ${data.error}`);
        break;
    }
  }, []);

  useSocket(handleSocketEvent);

  // ─── Derived metrics ──────────────────────────────────────────────────────────

  const totalProfit     = parseFloat(followers.reduce((s, f) => s + f.sessionStats.profit, 0).toFixed(2));
  const totalTrades     = followers.reduce((s, f) => s + f.sessionStats.totalTrades, 0);
  const activeFollowers = followers.filter((f) => f.copySettings.isActive).length;
  const totalWins       = followers.reduce((s, f) => s + f.sessionStats.wins, 0);
  const closed          = followers.reduce((s, f) => s + f.sessionStats.wins + f.sessionStats.losses, 0);
  const winRate         = closed > 0 ? Math.round((totalWins / closed) * 100) : 0;
  const todayStart = new Date(nowTick);
  todayStart.setHours(0, 0, 0, 0);
  const todayTrades = trades.filter((t) => new Date(t.openedAt).getTime() >= todayStart.getTime());

  // ─── Handlers ─────────────────────────────────────────────────────────────────

  const handleLogout = () => {
    tokenStore.clearTokens();
    navigate('/login', { replace: true });
  };

  const handleMasterConnected  = (info: AccountInfo) => { setMaster(info); setBullexConnected(true); setShowConnect(false); };
  const handleFollowerAdded    = (f: FollowerAccount)  => setFollowers((prev) => [f, ...prev]);
  const handleFollowerRemoved  = (id: string)          => setFollowers((prev) => prev.filter((f) => f.id !== id));
  const handleFollowerUpdated  = (f: FollowerAccount)  => setFollowers((prev) => prev.map((x) => x.id === f.id ? f : x));
  const handleBalanceRefresh   = (bal: Partial<AccountInfo>) => setMaster((m) => m ? { ...m, ...bal } : m);
  const handleCopyToggle       = (running: boolean) => setCopyRunning(running);
  const handleClearHistory     = () => setTrades([]);

  const pageLabels: Record<string, string> = {
    dashboard: 'Visão Geral',
    followers: 'Seguidores',
    history:   'Histórico',
    settings:  'Configurações',
  };

  const handleNavigate = (page: string) => {
    if (page === '__connect__') { setShowConnect(true); return; }
    setActivePage(page);
  };

  const renderPage = () => {
    switch (activePage) {
      case 'followers':
        return (
          <FollowersPage
            followers={followers}
            onAdd={() => setShowAddModal(true)}
            onRemove={handleFollowerRemoved}
            onUpdate={handleFollowerUpdated}
            masterId={master?.id}
            portalPath={portalPath}
          />
        );
      case 'history':
        return <HistoryPage followers={followers} onClear={handleClearHistory} />;
      case 'settings':
        return <SettingsPage isDark={isDark} onToggleTheme={toggle} user={tokenStore.getUser()} onLogout={handleLogout} />;
      default:
        return (
          <OverviewPage
            master={master} followers={followers} copyRunning={copyRunning}
            totalProfit={totalProfit} totalTrades={totalTrades} activeFollowers={activeFollowers}
            winRate={winRate} closedTrades={closed} recentTrades={todayTrades.slice(0, 10)}
            onMasterDisconnect={handleLogout} onBalanceRefresh={handleBalanceRefresh}
            onCopyToggle={handleCopyToggle} onAddFollower={() => setShowAddModal(true)}
            onFollowerRemove={handleFollowerRemoved} onFollowerUpdate={handleFollowerUpdated}
            onNavigate={handleNavigate}
          />
        );
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[var(--bg)]">
        <div className="w-6 h-6 border-2 border-brand-200 border-t-brand-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--bg)' }}>
      <Sidebar activePage={activePage} onPageChange={setActivePage} copyRunning={copyRunning} onLogout={handleLogout} />

      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <header className="flex-shrink-0 h-14 bg-[var(--surface)] border-b border-[var(--border)] flex items-center justify-between px-6 shadow-sm">
          <div className="min-w-0">
            <h1 className="text-[var(--text-1)] font-bold text-base leading-tight">{pageLabels[activePage]}</h1>
            {master && (
              <p className="text-[var(--text-3)] text-xs truncate">
                {master.name} · <span className={connected ? 'text-emerald-500' : 'text-red-400'}>{connected ? 'Conectado' : 'Reconectando...'}</span>
              </p>
            )}
          </div>

          <div className="flex items-center gap-1.5 flex-shrink-0">
            {(!master || !bullexConnected) && (
              <button onClick={() => setShowConnect(true)}
                className="flex items-center gap-1.5 text-xs font-bold px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white transition-all shadow-sm">
                <AlertTriangle className="w-3.5 h-3.5" />
                {master && !bullexConnected ? 'Reconectar Bullex' : 'Conectar conta Bullex'}
              </button>
            )}
            {activePage === 'followers' && (
              <button onClick={() => setShowAddModal(true)} className="btn-brand text-xs px-3.5 py-2">
                <UserPlus className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Adicionar</span>
              </button>
            )}
            <button onClick={toggle} className="btn-icon" title="Alternar tema">
              {isDark ? <Sun className="w-4 h-4 text-yellow-400" /> : <Moon className="w-4 h-4" />}
            </button>
            <button className="btn-icon" title="Notificações"><Bell className="w-4 h-4" /></button>
            <button className="btn-icon" onClick={() => setActivePage('settings')}><Settings className="w-4 h-4" /></button>
            {master && (
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-xs font-bold text-white ml-0.5">
                {master.name.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
        </header>

        <main className="flex-1 overflow-y-auto overflow-x-hidden min-w-0">
          {(!master || !bullexConnected) && (
            <div className="flex items-center gap-3 px-6 py-3 bg-amber-50 dark:bg-amber-500/10 border-b border-amber-200 dark:border-amber-500/20">
              <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0" />
              <p className="text-sm text-amber-700 dark:text-amber-300 flex-1">
                {master && !bullexConnected
                  ? <><strong>Sessão com a corretora expirada.</strong> A ligação foi interrompida (por exemplo após uma atualização). Reconecte para continuar o copy trading.</>
                  : <><strong>Conta da corretora não conectada.</strong> Para iniciar o copy trading, conecte sua conta Bullex.</>
                }
              </p>
              <button onClick={() => setShowConnect(true)}
                className="text-xs font-bold text-amber-700 dark:text-amber-300 underline underline-offset-2 flex-shrink-0 hover:text-amber-900 dark:hover:text-amber-100 transition-colors">
                {master && !bullexConnected ? 'Reconectar →' : 'Conectar agora →'}
              </button>
            </div>
          )}
          <div className="p-5 animate-fade-in max-w-[1440px] mx-auto">
            {renderPage()}
          </div>
        </main>
      </div>

      {showAddModal && (
        <AddFollowerModal onClose={() => setShowAddModal(false)} onAdded={handleFollowerAdded} />
      )}
      {showConnect && (
        <ConnectMasterModal
          onClose={() => setShowConnect(false)}
          onConnected={handleMasterConnected}
          prefillEmail={master?.email}
          isReconnect={!!master}
        />
      )}
    </div>
  );
}

/* ─── Overview ─────────────────────────────────────────────────────────────── */
function OverviewPage({
  master, followers, copyRunning, totalProfit, totalTrades,
  activeFollowers, winRate, closedTrades, recentTrades,
  onMasterDisconnect, onBalanceRefresh, onCopyToggle,
  onAddFollower, onFollowerRemove, onFollowerUpdate, onNavigate,
}: any) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-extrabold text-[var(--text-1)] tracking-tight">
          Bom dia, {master?.name?.split(' ')[0] ?? 'Trader'} 👋
        </h2>
        <p className="text-[var(--text-2)] text-sm mt-0.5">Monitore e gerencie suas operações em tempo real</p>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        <StatCard title="Lucro da Sessão" value={`${totalProfit >= 0 ? '+' : ''}$${totalProfit.toFixed(2)}`} icon={DollarSign} color={totalProfit >= 0 ? 'green' : 'red'} trend={totalProfit > 0 ? 'up' : totalProfit < 0 ? 'down' : 'neutral'} />
        <StatCard title="Seguidores Ativos" value={activeFollowers} subValue={`${followers.length} total`} icon={Users} color="blue" />
        <StatCard title="Operações" value={totalTrades} subValue="nesta sessão" icon={Activity} color="purple" />
        <StatCard title="Win Rate" value={`${winRate}%`} subValue={`${closedTrades} fechadas`} icon={BarChart2} color={winRate >= 60 ? 'green' : winRate >= 40 ? 'yellow' : 'red'} trend={winRate >= 60 ? 'up' : winRate >= 40 ? 'neutral' : 'down'} />
      </div>

      <div className="grid grid-cols-12 gap-4 min-w-0">
        <div className="col-span-12 lg:col-span-4 xl:col-span-3 space-y-4 min-w-0">
          <MasterCard account={master} copyRunning={copyRunning}
            onDisconnect={onMasterDisconnect} onCopyToggle={onCopyToggle}
            onBalanceRefresh={onBalanceRefresh}
            onConnectRequest={() => onNavigate('__connect__')} />

          <div className="card overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
              <p className="text-[var(--text-1)] font-semibold text-sm">Seguidores</p>
              <button onClick={() => onNavigate('followers')} className="flex items-center gap-1 text-xs text-brand-600 dark:text-brand-400 hover:underline font-medium">
                Ver todos <ExternalLink className="w-3 h-3" />
              </button>
            </div>
            <div className="py-1.5 px-1">
              {followers.length === 0 ? (
                <button onClick={onAddFollower} className="w-full rounded-xl border border-dashed border-[var(--border)] hover:border-brand-400/50 flex flex-col items-center gap-2 my-2 p-5 transition-all group">
                  <UserPlus className="w-5 h-5 text-[var(--text-3)] group-hover:text-brand-500 transition-colors" />
                  <span className="text-xs text-[var(--text-3)] group-hover:text-brand-500 font-medium transition-colors">Adicionar seguidor</span>
                </button>
              ) : (
                <>
                  {followers.slice(0, 5).map((f: FollowerAccount) => (
                    <FollowerMiniCard key={f.id} follower={f} onUpdate={onFollowerUpdate} />
                  ))}
                  {followers.length > 5 && (
                    <button onClick={() => onNavigate('followers')} className="w-full text-center text-xs text-[var(--text-3)] hover:text-brand-500 py-2 transition-colors font-medium">
                      +{followers.length - 5} mais →
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        <div className="col-span-12 lg:col-span-8 xl:col-span-9 min-w-0 overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-[var(--text-1)] font-bold text-base">Últimas Operações</h3>
              <p className="text-[var(--text-3)] text-xs">Sincronizado em tempo real com a corretora</p>
            </div>
            <button onClick={() => onNavigate('history')} className="flex items-center gap-1 text-xs text-brand-600 dark:text-brand-400 font-semibold flex-shrink-0">
              Histórico completo <ExternalLink className="w-3 h-3" />
            </button>
          </div>
          <TradeHistory trades={recentTrades} onClear={() => {}} compact={false} />
        </div>
      </div>
    </div>
  );
}

/* ─── History page (persistido + filtros) ───────────────────────────────────── */
function HistoryPage({
  followers,
  onClear,
}: {
  followers: FollowerAccount[];
  onClear: () => void;
}) {
  const [loading, setLoading] = useState(true);
  const [trades, setTrades] = useState<TradeRecord[]>([]);
  const [status, setStatus] = useState<'all' | 'OPEN' | 'WIN' | 'LOSS'>('all');
  const [followerId, setFollowerId] = useState('');
  const [search, setSearch] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await tradesApi.list({
        page: 1,
        limit: 300,
        status,
        followerId: followerId || undefined,
        search: search || undefined,
        from: from ? new Date(from).toISOString() : undefined,
        to: to ? new Date(`${to}T23:59:59`).toISOString() : undefined,
      });
      setTrades(data.trades ?? []);
    } catch (err: any) {
      toast.error(err?.response?.data?.error ?? 'Erro ao carregar histórico');
    } finally {
      setLoading(false);
    }
  }, [status, followerId, search, from, to]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="space-y-4">
      <div className="card p-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-3">
        <select className="field" value={status} onChange={(e) => setStatus(e.target.value as any)}>
          <option value="all">Todos</option>
          <option value="OPEN">Abertas</option>
          <option value="WIN">Wins</option>
          <option value="LOSS">Losses</option>
        </select>
        <select className="field" value={followerId} onChange={(e) => setFollowerId(e.target.value)}>
          <option value="">Todos os seguidores</option>
          {followers.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
        </select>
        <input className="field" placeholder="Buscar ativo/direção/seguidor" value={search} onChange={(e) => setSearch(e.target.value)} />
        <input className="field" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        <input className="field" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
      </div>

      {loading ? (
        <div className="card p-8 text-center text-c3 text-sm">Carregando histórico...</div>
      ) : (
        <TradeHistory trades={trades} onClear={() => { onClear(); load(); }} showClear />
      )}
    </div>
  );
}

/* ─── Followers page ────────────────────────────────────────────────────────── */
function FollowersPage({ followers, onAdd, onRemove, onUpdate, masterId, portalPath }: { followers: FollowerAccount[]; onAdd: () => void; onRemove: (id: string) => void; onUpdate: (f: FollowerAccount) => void; masterId?: string; portalPath?: string | null }) {
  const origin = window.location.origin;
  const portalUrl = portalPath
    ? `${origin}${portalPath}`
    : masterId
      ? `${origin}/portal/${masterId}`
      : `${origin}/login`;

  const copyPortalLink = () => {
    navigator.clipboard.writeText(portalUrl);
    toast.success('Link copiado!');
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-extrabold text-[var(--text-1)]">Seguidores</h2>
          <p className="text-[var(--text-2)] text-sm mt-0.5">{followers.length} conta(s)</p>
        </div>
        <button onClick={onAdd} className="btn-brand px-5 py-2.5">
          <UserPlus className="w-4 h-4" /> Adicionar conta
        </button>
      </div>

      {/* Portal invite banner */}
      <div className="card p-4 flex items-center gap-4 border-l-4 border-brand-500">
        <div className="w-10 h-10 rounded-xl bg-brand-50 dark:bg-brand-500/15 flex items-center justify-center flex-shrink-0">
          <Link2 className="w-5 h-5 text-brand-600 dark:text-brand-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[var(--text-1)] font-semibold text-sm">Portal de auto-cadastro para seguidores</p>
          <p className="text-[var(--text-3)] text-xs mt-0.5 truncate">
            <span className="font-mono text-brand-600 dark:text-brand-400">{portalUrl}</span>
          </p>
          {!portalPath && masterId && (
            <p className="text-[10px] text-amber-600 dark:text-amber-400 mt-1">
              Link usando ID interno. Peça ao administrador um endereço personalizado (ex.: /portal/seu-nome).
            </p>
          )}
        </div>
        <button onClick={copyPortalLink} className="flex-shrink-0 flex items-center gap-1.5 text-xs border border-[var(--border)] rounded-lg px-3 py-2 hover:border-brand-400 text-[var(--text-2)] hover:text-brand-600 transition-all">
          <Copy className="w-3.5 h-3.5" /> Copiar
        </button>
      </div>

      {followers.length === 0 ? (
        <div className="card flex flex-col items-center py-24 gap-4">
          <Users className="w-10 h-10 text-[var(--text-3)]" />
          <div className="text-center">
            <p className="text-[var(--text-1)] font-semibold mb-1">Nenhum seguidor ainda</p>
            <p className="text-[var(--text-2)] text-sm mb-5">Adicione contas ou compartilhe o link do portal</p>
            <button onClick={onAdd} className="btn-brand mx-auto px-5 py-2.5">
              <UserPlus className="w-4 h-4" /> Adicionar primeiro
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {followers.map((f) => (
            <FollowerCard key={f.id} follower={f} onRemove={onRemove} onUpdate={onUpdate} />
          ))}
          <button onClick={onAdd} className="rounded-2xl border-2 border-dashed border-[var(--border)] hover:border-brand-400/50 flex flex-col items-center justify-center gap-3 transition-all group min-h-[200px]">
            <UserPlus className="w-6 h-6 text-[var(--text-3)] group-hover:text-brand-500 transition-colors" />
            <span className="text-[var(--text-3)] group-hover:text-brand-500 text-sm font-semibold transition-colors">Nova conta</span>
          </button>
        </div>
      )}
    </div>
  );
}

/* ─── Settings page ─────────────────────────────────────────────────────────── */
function SettingsPage({ isDark, onToggleTheme, user, onLogout }: { isDark: boolean; onToggleTheme: () => void; user: any; onLogout: () => void }) {
  return (
    <div className="max-w-2xl space-y-5">
      <div>
        <h2 className="text-2xl font-extrabold text-[var(--text-1)]">Configurações</h2>
        <p className="text-[var(--text-2)] text-sm mt-0.5">Preferências e informações do sistema</p>
      </div>

      {user && (
        <div className="card p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-white font-bold text-lg">
              {(user.name?.charAt(0) ?? '?').toUpperCase()}
            </div>
            <div>
              <p className="font-semibold text-[var(--text-1)]">{user.name}</p>
              <p className="text-xs text-[var(--text-3)]">{user.email}</p>
            </div>
          </div>
          <button onClick={onLogout} className="flex items-center gap-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 px-3 py-2 rounded-xl transition-colors">
            <LogOut className="w-4 h-4" /> Sair da conta
          </button>
        </div>
      )}

      <div className="card">
        <div className="px-5 py-4 border-b border-[var(--border)]">
          <h3 className="text-[var(--text-1)] font-semibold">Aparência</h3>
        </div>
        <div className="p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[var(--bg)] border border-[var(--border)] flex items-center justify-center">
              {isDark ? <Moon className="w-5 h-5 text-[var(--text-2)]" /> : <Sun className="w-5 h-5 text-yellow-500" />}
            </div>
            <div>
              <p className="text-[var(--text-1)] font-medium text-sm">{isDark ? 'Modo Escuro' : 'Modo Claro'}</p>
              <p className="text-[var(--text-3)] text-xs">Alterna entre tema claro e escuro</p>
            </div>
          </div>
          <button onClick={onToggleTheme} className={`w-12 h-6 rounded-full transition-all relative ${isDark ? 'bg-brand-500' : 'bg-gray-200 dark:bg-white/15'}`}>
            <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${isDark ? 'left-6' : 'left-0.5'}`} />
          </button>
        </div>
      </div>

      <div className="card">
        <div className="px-5 py-4 border-b border-[var(--border)]">
          <h3 className="text-[var(--text-1)] font-semibold">Sobre o CopyTrader</h3>
        </div>
        <div className="p-5 grid grid-cols-2 gap-3">
          {[
            { k: 'Corretora', v: 'Bull-ex' },
            { k: 'Ligação', v: 'Tempo real com a corretora' },
            { k: 'Painel', v: 'CopyTrader' },
            { k: 'Versão', v: '2.0' },
          ].map(({ k, v }) => (
            <div key={k} className="bg-[var(--bg)] border border-[var(--border)] rounded-xl p-3.5">
              <p className="text-xs text-[var(--text-3)] mb-1">{k}</p>
              <p className="text-[var(--text-1)] font-semibold text-sm">{v}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

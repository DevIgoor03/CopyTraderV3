import { TrendingUp, LayoutDashboard, Users, History, Settings, LogOut, HelpCircle } from 'lucide-react';

interface SidebarProps {
  activePage: string;
  onPageChange: (page: string) => void;
  copyRunning: boolean;
  onLogout: () => void;
}

const navItems = [
  { id: 'dashboard', label: 'Dashboard',     icon: LayoutDashboard },
  { id: 'followers', label: 'Seguidores',    icon: Users },
  { id: 'history',   label: 'Histórico',     icon: History },
  { id: 'settings',  label: 'Configurações', icon: Settings },
];

export default function Sidebar({ activePage, onPageChange, copyRunning, onLogout }: SidebarProps) {
  return (
    <nav className="w-[60px] flex-shrink-0 bg-sidebar flex flex-col items-center h-full py-4 gap-1">
      {/* Logo */}
      <div className="w-9 h-9 rounded-xl bg-brand-gradient flex items-center justify-center mb-4 shadow-glow-brand flex-shrink-0">
        <TrendingUp className="w-4.5 h-4.5 text-white" strokeWidth={2.5} />
      </div>

      {/* Nav */}
      <div className="flex flex-col gap-0.5 flex-1 w-full px-2.5">
        {navItems.map(({ id, label, icon: Icon }) => {
          const active = activePage === id;
          return (
            <button
              key={id}
              onClick={() => onPageChange(id)}
              title={label}
              className={`relative w-full h-10 flex items-center justify-center rounded-lg transition-all duration-150 group ${
                active ? 'bg-sidebar-active text-white' : 'text-gray-500 hover:bg-sidebar-hover hover:text-gray-200'
              }`}
            >
              <Icon className="w-[17px] h-[17px]" strokeWidth={active ? 2.5 : 2} />
              {active && (
                <span className="absolute right-0 top-1/2 -translate-y-1/2 w-0.5 h-4 rounded-full bg-brand-400" />
              )}
              <span className="absolute left-full ml-2.5 px-2 py-1 bg-gray-900 text-white text-xs rounded-lg
                               opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap
                               transition-opacity z-50 shadow-lg border border-white/10">
                {label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Copy running dot */}
      {copyRunning && (
        <div className="w-8 h-8 rounded-lg bg-brand-500/15 flex items-center justify-center mb-1" title="Copiando ao vivo">
          <span className="w-2 h-2 rounded-full bg-brand-400 animate-pulse-dot" />
        </div>
      )}

      {/* Bottom */}
      <div className="flex flex-col gap-0.5 w-full px-2.5">
        <button title="Ajuda"
          className="w-full h-10 flex items-center justify-center rounded-lg text-gray-600 hover:bg-sidebar-hover hover:text-gray-300 transition-all">
          <HelpCircle className="w-[17px] h-[17px]" strokeWidth={2} />
        </button>
        <button onClick={onLogout} title="Sair"
          className="w-full h-10 flex items-center justify-center rounded-lg text-gray-600 hover:bg-red-500/15 hover:text-red-400 transition-all">
          <LogOut className="w-[17px] h-[17px]" strokeWidth={2} />
        </button>
      </div>
    </nav>
  );
}

import { Link, useLocation } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';

export const marketingBg = 'bg-[oklch(0.065_0.01_155)]';
export const marketingSurface = 'bg-[oklch(0.095_0.01_155)]/80';
export const marketingSurfaceSolid = 'bg-[oklch(0.088_0.01_155)]';
export const marketingText = 'text-[oklch(0.94_0.006_155)]';
export const marketingMuted = 'text-[oklch(0.52_0.018_152)]';
export const marketingBorderSubtle = 'border-white/[0.08]';

const navPillClass =
  'inline-flex items-center rounded-full bg-white/[0.06] px-4 py-2 text-sm font-medium text-[oklch(0.52_0.018_152)] transition-colors hover:bg-white/[0.1] hover:text-[oklch(0.94_0.006_155)]';

export type MarketingNavItem = { href: string; label: string };

/** Menu principal: igual na home e no guia do copy (âncoras da home com /#…). */
export const MARKETING_MAIN_NAV: MarketingNavItem[] = [
  { href: '/#sobre', label: 'Sobre nós' },
  { href: '/copy-trading', label: 'Guia do copy' },
  { href: '/#contato', label: 'Contato' },
];

function NavItem({ href, label }: MarketingNavItem) {
  const location = useLocation();

  if (href.startsWith('#') && !href.startsWith('/')) {
    return (
      <a href={href} className={navPillClass}>
        {label}
      </a>
    );
  }

  const homeSection = href.match(/^\/#([\w-]+)$/);
  if (homeSection) {
    const id = homeSection[1];
    return (
      <Link
        to={{ pathname: '/', hash: id }}
        className={navPillClass}
        onClick={() => {
          if (location.pathname === '/') {
            requestAnimationFrame(() => {
              document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            });
          }
        }}
      >
        {label}
      </Link>
    );
  }

  return (
    <Link to={href} className={navPillClass}>
      {label}
    </Link>
  );
}

export function LogoMark({ className = '' }: { className?: string }) {
  return (
    <div
      className={`grid grid-cols-2 gap-0.5 w-8 h-8 rotate-45 rounded-sm ${className}`}
      aria-hidden
    >
      <span className="rounded-sm bg-[oklch(0.62_0.20_152)]" />
      <span className="rounded-sm bg-white/20" />
      <span className="rounded-sm bg-white/15" />
      <span className="rounded-sm bg-[oklch(0.62_0.20_152)]/55" />
    </div>
  );
}

export function MarketingHeader({ navItems }: { navItems: MarketingNavItem[] }) {
  return (
    <header
      className={`sticky top-0 z-50 border-b ${marketingBorderSubtle} ${marketingBg}/90 backdrop-blur-xl`}
    >
      <div className="mx-auto max-w-7xl px-5 py-4 lg:px-8">
        <div className="flex items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-3 shrink-0 group">
            <LogoMark className="group-hover:scale-105 transition-transform" />
            <span className="font-display text-lg font-bold tracking-tight">CopyTrader</span>
          </Link>

          <nav
            className="hidden md:flex flex-1 flex-wrap items-center justify-center gap-2 lg:gap-1"
            aria-label="Principal"
          >
            {navItems.map((item) => (
              <NavItem key={item.href + item.label} {...item} />
            ))}
          </nav>

          <Link
            to="/login"
            className="inline-flex shrink-0 items-center gap-2 rounded-full bg-white/[0.08] pl-2 pr-4 py-2 text-sm font-semibold text-[oklch(0.94_0.006_155)] ring-1 ring-white/10 transition hover:bg-white/[0.12]"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[oklch(0.62_0.20_152)] text-white">
              <ArrowUpRight className="h-4 w-4" strokeWidth={2.5} />
            </span>
            Entrar
          </Link>
        </div>

        <nav
          className="mt-3 flex gap-2 overflow-x-auto pb-1 md:hidden [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          aria-label="Principal móvel"
        >
          {navItems.map((item) => (
            <NavItem key={`m-${item.href + item.label}`} {...item} />
          ))}
        </nav>
      </div>
    </header>
  );
}

export function MarketingFooter() {
  return (
    <footer
      className={`border-t ${marketingBorderSubtle} px-5 py-6 text-center text-xs text-[oklch(0.52_0.018_152)] lg:px-8`}
    >
      CopyTrader · Copy trading para Bull-ex
    </footer>
  );
}

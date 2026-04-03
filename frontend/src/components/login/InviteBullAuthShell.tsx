import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, Zap } from 'lucide-react';

type Props = {
  logoLabel: string;
  /** Se omitido ou null, não mostra link no canto superior direito. */
  adminLink?: { to: string; label: string } | null;
  children: ReactNode;
  tickerItems: string[];
};

/** Shell das páginas de login (grain, aurora, header, marquee). */
export function InviteBullAuthShell({ logoLabel, adminLink = null, children, tickerItems }: Props) {
  /* Duas sequências idênticas: translateX(-50%) move exatamente um ciclo (loop contínuo). */
  const loop = [...tickerItems, ...tickerItems];

  return (
    <div className="login-auth-shell dark min-h-screen bg-[oklch(0.065_0.01_155)] text-[oklch(0.94_0.006_155)] flex flex-col overflow-hidden antialiased font-sans">
      <svg className="hidden" aria-hidden>
        <filter id="invite-grain-filter">
          <feTurbulence type="fractalNoise" baseFrequency="0.75" numOctaves="4" stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
      </svg>
      <div
        className="fixed inset-0 z-[1] pointer-events-none opacity-[0.028]"
        style={{ filter: 'url(#invite-grain-filter)', background: 'white' }}
      />

      <div className="fixed inset-0 z-0 overflow-hidden">
        <div className="absolute inset-0 bg-[oklch(0.065_0.01_155)]" />
        <div
          className="animate-invite-aurora-1 absolute -top-[30%] -left-[20%] w-[70%] h-[70%] rounded-full blur-[120px]"
          style={{ background: 'oklch(0.38 0.18 152 / 0.28)' }}
        />
        <div
          className="animate-invite-aurora-2 absolute top-[20%] right-[-15%] w-[55%] h-[55%] rounded-full blur-[110px]"
          style={{ background: 'oklch(0.32 0.16 175 / 0.18)' }}
        />
        <div
          className="animate-invite-aurora-3 absolute bottom-[-20%] left-[30%] w-[45%] h-[50%] rounded-full blur-[100px]"
          style={{ background: 'oklch(0.28 0.14 140 / 0.15)' }}
        />
      </div>

      <header className="relative z-10 flex items-center justify-between px-8 lg:px-12 py-6">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-[oklch(0.62_0.20_152)] flex items-center justify-center">
            <Zap className="w-3.5 h-3.5 text-white" fill="white" />
          </div>
          <span className="font-display font-bold text-base tracking-tight">{logoLabel}</span>
        </div>
        {adminLink ? (
          <Link
            to={adminLink.to}
            className="flex items-center gap-1 text-xs text-[oklch(0.52_0.018_152)] hover:text-[oklch(0.94_0.006_155)] transition-colors group"
          >
            {adminLink.label}
            <ArrowUpRight className="w-3 h-3 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </Link>
        ) : (
          <div className="w-0 shrink-0" aria-hidden />
        )}
      </header>

      <main className="relative z-10 flex-1 flex items-center px-8 lg:px-12 py-8 lg:py-0">{children}</main>

      <div className="relative z-10 border-t border-white/[0.06] bg-black overflow-hidden py-3">
        {/*
          w-max obrigatório: sem isto o flex fica com largura 100% e -50% no keyframe
          desloca metade do ecrã, não metade do conteúdo — o marquee não “passa”.
        */}
        <div className="login-marquee-track flex whitespace-nowrap will-change-transform">
          {loop.map((item, i) => (
            <span key={i} className="inline-flex items-center shrink-0">
              <span className="text-[11px] sm:text-xs font-semibold text-white uppercase tracking-[0.12em] px-5 sm:px-6">
                {item}
              </span>
              <span className="text-white text-[10px] sm:text-xs select-none px-0.5" aria-hidden>
                ✦
              </span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

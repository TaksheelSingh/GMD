import React from 'react';
import { Sun, Moon } from 'lucide-react';

interface SidebarProps {
  wsConnected: boolean;
  unreadAlertsCount: number;
  theme: 'dark' | 'light';
  currentView: 'dashboard' | 'alerts';
  onSelectView: (view: 'dashboard' | 'alerts') => void;
  onToggleTheme: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  wsConnected,
  unreadAlertsCount,
  theme,
  currentView,
  onSelectView,
  onToggleTheme
}) => {
  return (
    <aside className="sidebar flex flex-col justify-between">
      
      {/* Top Header: watcher. Brand Name + Theme Toggle beside it */}
      <div>
        <div className="flex items-center justify-between mb-8 pb-4 border-b border-[var(--border-color)]">
          <div className="flex items-center gap-1.5">
            <span className="font-extrabold text-2xl tracking-tight text-[var(--text-primary)]">
              watcher<span className="text-[#0A84FF]">.</span>
            </span>
          </div>

          {/* Theme Toggle Button right beside watcher. */}
          <button
            onClick={onToggleTheme}
            className="p-2 rounded-xl bg-[var(--bg-card-inner)] border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all shadow-sm"
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-500" />}
          </button>
        </div>

        {/* Section Label: MAIN */}
        <div className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-widest px-3 mb-3 font-mono">
          MAIN
        </div>

        {/* Minimal Sidebar Navigation Items (Dashboard & In-Site Alerts only) */}
        <nav className="space-y-2">
          
          {/* Dashboard Item */}
          <button
            onClick={() => onSelectView('dashboard')}
            className={`sidebar-nav-pill ${currentView === 'dashboard' ? 'active' : ''}`}
          >
            <span>Dashboard</span>
          </button>

          {/* In-Site Alerts Item */}
          <button
            onClick={() => onSelectView('alerts')}
            className={`sidebar-nav-pill ${currentView === 'alerts' ? 'active' : ''}`}
          >
            <span>In-Site Alerts</span>
            {unreadAlertsCount > 0 && (
              <span className="bg-[#FF453A] text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                {unreadAlertsCount}
              </span>
            )}
          </button>

        </nav>
      </div>

      {/* BOTTOM LEFT USER BADGE (Matching workaholic reference design r (255).png) */}
      <div 
        className="bottom-status-badge w-full cursor-pointer flex items-center justify-between shadow-sm"
        title={wsConnected ? 'Watcher Telemetry Active & Connected via WebSockets' : 'Reconnecting to Watcher Engine...'}
      >
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-[#0A84FF] text-white font-bold text-xs flex items-center justify-center shadow-sm">
            TR
          </div>
          <div>
            <div className="text-xs font-bold text-[var(--text-primary)] leading-none">Taksheel Rawat</div>
            <div className="text-[10px] text-[var(--text-secondary)] mt-0.5">Watcher User</div>
          </div>
        </div>
      </div>

    </aside>
  );
};

import React from 'react';
import { 
  Activity, 
  Bell, 
  Play, 
  Settings, 
  Volume2, 
  VolumeX, 
  Search, 
  X
} from 'lucide-react';

interface NavbarProps {
  wsConnected: boolean;
  unreadAlertsCount: number;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onOpenAlerts: () => void;
  onOpenSimulator: () => void;
  onOpenSettings: () => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  wsConnected,
  unreadAlertsCount,
  soundEnabled,
  onToggleSound,
  onOpenAlerts,
  onOpenSimulator,
  onOpenSettings,
  searchQuery,
  setSearchQuery
}) => {
  return (
    <header className="sticky top-0 z-40 liquid-glass border-b border-white/10 px-6 py-3.5 transition-all">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 max-w-7xl mx-auto">
        
        {/* Left: macOS Brand Header & Status */}
        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center text-white shadow-sm">
              <Activity className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-semibold text-base text-white tracking-tight">GMD Pulse</h1>
                <span className="text-[10px] font-medium tracking-wide uppercase px-2 py-0.5 rounded-full bg-white/10 text-slate-300 border border-white/10">
                  macOS Telemetry
                </span>
              </div>
              <p className="text-xs text-slate-400 font-normal">GitHub Actions Operational Monitor</p>
            </div>
          </div>

          {/* Live WebSockets Status Indicator */}
          <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-black/40 border border-white/10 text-xs font-medium">
            <span className={`w-2 h-2 rounded-full ${wsConnected ? 'bg-[#30D158] apple-live-dot' : 'bg-[#FF9F0A]'}`} />
            <span className={wsConnected ? 'text-slate-200 font-normal' : 'text-[#FF9F0A]'}>
              {wsConnected ? 'Live' : 'Connecting'}
            </span>
          </div>
        </div>

        {/* Center: Apple Search Bar */}
        <div className="relative w-full sm:max-w-md">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search repositories, branches, or steps..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-8 py-1.5 bg-white/5 border border-white/10 rounded-lg text-xs text-white placeholder-slate-400 focus:outline-none focus:border-[#0A84FF] focus:bg-white/10 transition-all font-sans"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Right: macOS Controls */}
        <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
          
          {/* Audio Chime Toggle */}
          <button
            onClick={onToggleSound}
            title={soundEnabled ? 'In-Site Sound Alerts Active' : 'Sound Alerts Muted'}
            className={`p-2 rounded-lg border text-xs transition-all ${
              soundEnabled 
                ? 'bg-white/10 border-white/15 text-white hover:bg-white/15' 
                : 'bg-black/30 border-white/10 text-slate-400 hover:text-slate-200'
            }`}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* Webhook Simulator Launcher */}
          <button
            onClick={onOpenSimulator}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0A84FF] hover:bg-[#0071E3] text-white text-xs font-semibold shadow-sm transition-all active:scale-95"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Simulator</span>
          </button>

          {/* In-Site Alert Drawer Bell Button */}
          <button
            onClick={onOpenAlerts}
            className="relative p-2 rounded-lg bg-white/5 border border-white/10 text-slate-300 hover:text-white hover:bg-white/10 transition-all"
            title="In-Site Alert Center"
          >
            <Bell className="w-4 h-4" />
            {unreadAlertsCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#FF453A] text-[10px] font-bold text-white shadow-md">
                {unreadAlertsCount > 9 ? '9+' : unreadAlertsCount}
              </span>
            )}
          </button>

          {/* Settings */}
          <button
            onClick={onOpenSettings}
            className="p-2 rounded-lg bg-white/5 border border-white/10 text-slate-300 hover:text-white hover:bg-white/10 transition-all"
            title="Settings & Webhook Secret"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>

      </div>
    </header>
  );
};

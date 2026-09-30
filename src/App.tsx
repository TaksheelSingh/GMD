import React, { useState, useEffect, useRef } from 'react';
import { Repository, WorkflowRun, SiteAlert, MetricsSummary } from './types';
import { Sidebar } from './components/Sidebar';
import { RepoGrid } from './components/RepoGrid';
import { InSiteAlertsPage } from './components/InSiteAlertsPage';
import { ErrorInspectorModal } from './components/ErrorInspectorModal';

export const App: React.FC = () => {
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [workflowRuns, setWorkflowRuns] = useState<WorkflowRun[]>([]);
  const [inSiteAlerts, setInSiteAlerts] = useState<SiteAlert[]>([]);
  const [metrics, setMetrics] = useState<MetricsSummary>({
    totalRepos: 0,
    passedRepos: 0,
    failedRepos: 0,
    healthPercentage: 100,
    totalRuns: 0,
    unreadAlertsCount: 0,
    mttrMinutes: 14.2
  });

  const [wsConnected, setWsConnected] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [soundEnabled] = useState<boolean>(true);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [currentView, setCurrentView] = useState<'dashboard' | 'alerts'>('dashboard');
  
  const [selectedRun, setSelectedRun] = useState<WorkflowRun | null>(null);

  const audioCtxRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'light') {
      root.classList.add('light');
      root.classList.remove('dark');
    } else {
      root.classList.add('dark');
      root.classList.remove('light');
    }
  }, [theme]);

  const playAlertSound = (type: 'failure' | 'recovery') => {
    if (!soundEnabled) return;
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      const now = ctx.currentTime;
      if (type === 'failure') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.exponentialRampToValueAtTime(220, now + 0.3);
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
        osc.start(now);
        osc.stop(now + 0.3);
      } else {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(523.25, now);
        osc.frequency.exponentialRampToValueAtTime(659.25, now + 0.2);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
        osc.start(now);
        osc.stop(now + 0.2);
      }
    } catch (e) {
      // Audio fallback
    }
  };

  useEffect(() => {
    fetchInitialData();

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.hostname}:5000/ws`;
    let ws: WebSocket;

    const connectWs = () => {
      ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        setWsConnected(true);
      };

      ws.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          const { event: eventType, data } = payload;

          if (eventType === 'WS_INIT') {
            setMetrics(data.metrics);
            setRepositories(data.repositories);
            setWorkflowRuns(data.recentRuns);
            setInSiteAlerts(data.inSiteAlerts);
          } else if (eventType === 'WS_NEW_RUN') {
            setWorkflowRuns(prev => [data, ...prev.filter(r => r.id !== data.id)].slice(0, 100));
            if (data.status === 'failed') {
              playAlertSound('failure');
            } else if (data.status === 'passed') {
              playAlertSound('recovery');
            }
          } else if (eventType === 'WS_METRICS_UPDATE') {
            setMetrics(data);
          } else if (eventType === 'WS_REPO_UPDATE') {
            setRepositories(prev => {
              const idx = prev.findIndex(r => r.name.toLowerCase() === data.name.toLowerCase());
              if (idx !== -1) {
                const updated = [...prev];
                updated[idx] = data;
                return updated;
              }
              return [data, ...prev];
            });
          } else if (eventType === 'WS_SITE_ALERT') {
            setInSiteAlerts(prev => [data, ...prev]);
          } else if (eventType === 'WS_ALERTS_UPDATED') {
            setInSiteAlerts(data);
          }
        } catch (err) {
          console.error('[WS Parse Error]', err);
        }
      };

      ws.onclose = () => {
        setWsConnected(false);
        setTimeout(connectWs, 3000);
      };
    };

    connectWs();

    return () => {
      if (ws) ws.close();
    };
  }, [soundEnabled]);

  const fetchInitialData = async () => {
    try {
      const [resStatus, resRepos, resRuns, resAlerts] = await Promise.all([
        fetch('/api/status').then(r => r.json()),
        fetch('/api/repos').then(r => r.json()),
        fetch('/api/runs').then(r => r.json()),
        fetch('/api/alerts').then(r => r.json())
      ]);

      if (resStatus.metrics) setMetrics(resStatus.metrics);
      if (Array.isArray(resRepos)) setRepositories(resRepos);
      if (Array.isArray(resRuns)) setWorkflowRuns(resRuns);
      if (Array.isArray(resAlerts)) setInSiteAlerts(resAlerts);
    } catch (err) {
      console.error('Failed to fetch initial data:', err);
    }
  };

  const handleMarkAllAlertsAsRead = async () => {
    try {
      await fetch('/api/alerts/mark-read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });
      setInSiteAlerts(prev => prev.map(a => ({ ...a, is_read: true })));
      setMetrics(prev => ({ ...prev, unreadAlertsCount: 0 }));
    } catch (err) {
      console.error(err);
    }
  };

  const handleSelectRunById = (runId: string) => {
    const target = workflowRuns.find(r => r.id === runId || r.run_id === runId);
    if (target) {
      setSelectedRun(target);
    }
  };

  const filteredRepos = repositories.filter(repo => {
    const q = searchQuery.toLowerCase();
    return repo.name.toLowerCase().includes(q) ||
           repo.default_branch.toLowerCase().includes(q) ||
           (repo.last_run?.workflow_name || '').toLowerCase().includes(q) ||
           (repo.last_run?.failed_step || '').toLowerCase().includes(q);
  });

  return (
    <div className={`min-h-screen flex flex-col md:flex-row font-sans selection:bg-[#0A84FF] selection:text-white ${theme}`}>
      
      {/* 1. Left Navigation Sidebar */}
      <Sidebar
        wsConnected={wsConnected}
        unreadAlertsCount={metrics.unreadAlertsCount}
        theme={theme}
        currentView={currentView}
        onSelectView={(v) => setCurrentView(v)}
        onToggleTheme={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      />

      {/* 2. Main Workspace */}
      <main className="main-workspace">
        
        {/* Dynamic View: Dashboard vs Dedicated In-Site Alerts Page */}
        <div className="flex-1">
          {currentView === 'dashboard' ? (
            <div className="space-y-6">
              
              {/* Dashboard Title & Subtitle */}
              <div className="mb-6">
                <h1 className="text-3xl font-extrabold text-[var(--text-primary)] tracking-tight">
                  Dashboard
                </h1>
                <p className="text-xs text-[var(--text-secondary)] mt-1 font-normal">
                  Real-time leave balances, half-day allocations, and monthly attendance tracking.
                </p>
              </div>

              {/* 3-Column Layout: Col 1 Repo Card (2.2fr) | Col 2 (3 Small Cards 1fr) | Col 3 (3 Small Cards 1fr) */}
              <div className="dashboard-3col-kpi-grid">
                
                {/* Column 1: Repo Card */}
                <div className="col-repo-card">
                  <RepoGrid
                    repositories={filteredRepos}
                    recentRuns={workflowRuns}
                    searchQuery={searchQuery}
                    setSearchQuery={setSearchQuery}
                    onSelectRun={(run) => setSelectedRun(run)}
                  />
                </div>

                {/* Column 2: Stack of 3 Small KPI Cards with Smooth Lift & Shadow Hover Effect */}
                <div className="flex flex-col justify-between gap-3 h-full">
                  
                  {/* Card 1: Pass Rate */}
                  <div className="kpi-hover-card flex-1">
                    <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-1">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#30D158]" />
                      <span>PASS RATE &bull; ORG HEALTH</span>
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-extrabold text-[var(--text-primary)]">{metrics.healthPercentage}%</span>
                      <span className="text-[11px] font-mono text-[var(--text-secondary)]">RATIO</span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-[var(--text-secondary)] mt-2 font-mono pt-1 border-t border-[var(--border-color)]">
                      <span>Passed: {metrics.passedRepos}</span>
                      <span>Failed: {metrics.failedRepos}</span>
                    </div>
                  </div>

                  {/* Card 2: Broken Repos */}
                  <div className="kpi-hover-card flex-1 border-[#FF453A]/30 bg-[#FF453A]/5">
                    <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-[#FF453A] mb-1">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#FF453A] live-dot-blinking" />
                      <span>BROKEN REPOS &bull; FAILING</span>
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-extrabold text-[#FF453A]">{metrics.failedRepos}</span>
                      <span className="text-[11px] font-mono text-slate-400">REPOS</span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-rose-400/80 mt-2 font-mono pt-1 border-t border-[#FF453A]/20">
                      <span>Immediate Action</span>
                      <span>Critical</span>
                    </div>
                  </div>

                  {/* Card 3: Total Runs */}
                  <div className="kpi-hover-card flex-1">
                    <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-1">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#0A84FF]" />
                      <span>TOTAL RUNS &bull; TELEMETRY</span>
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-extrabold text-[var(--text-primary)]">{metrics.totalRuns}</span>
                      <span className="text-[11px] font-mono text-[var(--text-secondary)]">RUNS</span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-[var(--text-secondary)] mt-2 font-mono pt-1 border-t border-[var(--border-color)]">
                      <span>Webhooks: {metrics.totalRuns}</span>
                      <span>Live Stream</span>
                    </div>
                  </div>

                </div>

                {/* Column 3: Stack of 3 Small KPI Cards with Smooth Lift & Shadow Hover Effect */}
                <div className="flex flex-col justify-between gap-3 h-full">
                  
                  {/* Card 4: Recovery MTTR */}
                  <div className="kpi-hover-card flex-1">
                    <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-1">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#FF9F0A]" />
                      <span>RECOVERY MTTR &bull; LATENCY</span>
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-extrabold text-[#FF9F0A]">{metrics.mttrMinutes}m</span>
                      <span className="text-[11px] font-mono text-[var(--text-secondary)]">MINUTES</span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-[#30D158] mt-2 font-mono pt-1 border-t border-[var(--border-color)]">
                      <span>Avg Resolution</span>
                      <span>Optimal</span>
                    </div>
                  </div>

                  {/* Card 5: Unread Alerts */}
                  <div className="kpi-hover-card flex-1">
                    <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-1">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#BF5AF2]" />
                      <span>UNREAD ALERTS &bull; SITE</span>
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-extrabold text-[var(--text-primary)]">{metrics.unreadAlertsCount}</span>
                      <span className="text-[11px] font-mono text-[var(--text-secondary)]">ALERTS</span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-[var(--text-secondary)] mt-2 font-mono pt-1 border-t border-[var(--border-color)]">
                      <span>In-Site Feed</span>
                      <span>Active</span>
                    </div>
                  </div>

                  {/* Card 6: Active Repos */}
                  <div className="kpi-hover-card flex-1">
                    <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-1">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#30D158]" />
                      <span>ACTIVE REPOS &bull; MONITORED</span>
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-extrabold text-[var(--text-primary)]">{metrics.totalRepos}</span>
                      <span className="text-[11px] font-mono text-[var(--text-secondary)]">PROJECTS</span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-[var(--text-secondary)] mt-2 font-mono pt-1 border-t border-[var(--border-color)]">
                      <span>Discovered: {metrics.totalRepos}</span>
                      <span>Tracked</span>
                    </div>
                  </div>

                </div>

              </div>
            </div>
          ) : (
            /* Dedicated Row-Wise In-Site Alerts Page */
            <InSiteAlertsPage
              alerts={inSiteAlerts}
              onMarkAllAsRead={handleMarkAllAlertsAsRead}
              onSelectRunById={handleSelectRunById}
            />
          )}
        </div>

        {/* Dashboard Footer anchored at very bottom with dashed line directly above © 2026 Watcher */}
        <footer className="mt-auto pt-4 pb-4 border-t border-dashed border-[var(--border-color)] text-center text-xs text-[var(--text-secondary)] space-y-1">
          <p className="font-semibold text-[var(--text-primary)]">
            &copy; 2026 Watcher. All pipelines accounted for. Zero broken builds, zero deployment headaches.
          </p>
          <p className="text-[11px] text-[var(--text-muted)]">
            Made by Taksheel Rawat
          </p>
          <p className="text-[11px] text-[var(--text-muted)]">
            Telemetry monitored by Watcher Engine
          </p>
        </footer>

      </main>

      {/* Error Inspector Modal */}
      <ErrorInspectorModal
        run={selectedRun}
        onClose={() => setSelectedRun(null)}
      />

    </div>
  );
};

export default App;

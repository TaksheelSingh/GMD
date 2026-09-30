import React, { useState, useEffect, useRef } from 'react';
import { Repository, WorkflowRun, SiteAlert, MetricsSummary } from './types';
import { Sidebar } from './components/Sidebar';
import { RepoGrid } from './components/RepoGrid';
import { KpiCardGrid } from './components/KpiCardGrid';
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
    healthPercentage: 0,
    totalRuns: 0,
    unreadAlertsCount: 0,
    mttrMinutes: 0
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
              <div className="mb-6 pb-4 border-b border-[var(--border-color)]">
                <h1 className="text-3xl font-extrabold text-[var(--text-primary)] tracking-tight">
                  Dashboard
                </h1>
                <p className="text-sm text-[var(--text-secondary)] mt-1 font-normal">
                  Real-time pipeline health, GitHub action runs, and automated telemetry metrics.
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

                {/* Columns 2 & 3: Modular KPI Card Grid */}
                <KpiCardGrid metrics={metrics} />

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

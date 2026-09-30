import React from 'react';
import { MetricsSummary } from '../types';

interface KpiCardGridProps {
  metrics: MetricsSummary;
}

export const KpiCardGrid: React.FC<KpiCardGridProps> = ({ metrics }) => {
  return (
    <>
      {/* Column 2: Stack of 3 Small KPI Cards */}
      <div className="flex flex-col justify-between gap-3 h-full">
        
        {/* Card 1: Pass Rate */}
        <div className="kpi-hover-card flex-1">
          <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-[#30D158]" />
            <span>PASS RATE</span>
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
            <span>BROKEN REPOS</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-[#FF453A]">{metrics.failedRepos}</span>
            <span className="text-[11px] font-mono text-[var(--text-secondary)]">REPOS</span>
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
            <span>TOTAL RUNS</span>
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

      {/* Column 3: Stack of 3 Small KPI Cards */}
      <div className="flex flex-col justify-between gap-3 h-full">
        
        {/* Card 4: Recovery MTTR */}
        <div className="kpi-hover-card flex-1">
          <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-[#FF9F0A]" />
            <span>RECOVERY MTTR</span>
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
            <span>UNREAD ALERTS</span>
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
            <span>ACTIVE REPOS</span>
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
    </>
  );
};

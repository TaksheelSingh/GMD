import React from 'react';
import { MetricsSummary } from '../types';
import { ShieldCheck, AlertCircle, Zap, Clock } from 'lucide-react';

interface MetricsOverviewProps {
  metrics: MetricsSummary;
}

export const MetricsOverview: React.FC<MetricsOverviewProps> = ({ metrics }) => {
  const isHealthy = metrics.healthPercentage >= 80;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      
      {/* 1. Org Pass Rate */}
      <div className="apple-card p-5 relative flex flex-col justify-between">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
            Health Ratio
          </span>
          <div className={`p-1.5 rounded-md ${isHealthy ? 'bg-[#30D158]/10 text-[#30D158]' : 'bg-[#FF453A]/10 text-[#FF453A]'}`}>
            <ShieldCheck className="w-4 h-4" />
          </div>
        </div>

        <div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-white tracking-tight">
              {metrics.healthPercentage}%
            </span>
            <span className="text-xs text-slate-400">
              ({metrics.passedRepos}/{metrics.totalRepos} Healthy)
            </span>
          </div>

          <div className="w-full bg-white/10 h-1.5 rounded-full mt-3 overflow-hidden">
            <div 
              className={`h-full transition-all duration-500 ${isHealthy ? 'bg-[#30D158]' : 'bg-[#FF453A]'}`}
              style={{ width: `${metrics.healthPercentage}%` }}
            />
          </div>
        </div>
      </div>

      {/* 2. Active Broken Pipelines */}
      <div className={`apple-card p-5 relative flex flex-col justify-between ${metrics.failedRepos > 0 ? 'border-[#FF453A]/40 bg-[#FF453A]/5' : ''}`}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
            Failing Repos
          </span>
          <div className="p-1.5 rounded-md bg-[#FF453A]/10 text-[#FF453A]">
            <AlertCircle className="w-4 h-4" />
          </div>
        </div>

        <div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-[#FF453A] tracking-tight">
              {metrics.failedRepos}
            </span>
            <span className="text-xs text-slate-400">Attention required</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-2">
            {metrics.failedRepos > 0 ? 'Build failure detected' : 'All systems operating normally'}
          </p>
        </div>
      </div>

      {/* 3. Ingested Runs */}
      <div className="apple-card p-5 relative flex flex-col justify-between">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
            Total Telemetry Runs
          </span>
          <div className="p-1.5 rounded-md bg-[#0A84FF]/10 text-[#0A84FF]">
            <Zap className="w-4 h-4" />
          </div>
        </div>

        <div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-white tracking-tight">
              {metrics.totalRuns}
            </span>
            <span className="text-xs text-slate-400">Workflow events</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-2">
            Passive GitHub webhook stream
          </p>
        </div>
      </div>

      {/* 4. MTTR */}
      <div className="apple-card p-5 relative flex flex-col justify-between">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
            Avg MTTR Recovery
          </span>
          <div className="p-1.5 rounded-md bg-[#FF9F0A]/10 text-[#FF9F0A]">
            <Clock className="w-4 h-4" />
          </div>
        </div>

        <div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-[#FF9F0A] tracking-tight">
              {metrics.mttrMinutes}m
            </span>
            <span className="text-xs text-slate-400">Mean time to fix</span>
          </div>
          <p className="text-[11px] text-[#30D158] mt-2 font-medium">
            Fast resolution cycle
          </p>
        </div>
      </div>

    </div>
  );
};

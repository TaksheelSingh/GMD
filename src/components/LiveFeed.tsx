import React from 'react';
import { WorkflowRun } from '../types';
import { 
  Clock, 
  GitBranch, 
  Terminal, 
  Activity,
  ArrowRight
} from 'lucide-react';

interface LiveFeedProps {
  runs: WorkflowRun[];
  onSelectRun: (run: WorkflowRun) => void;
}

export const LiveFeed: React.FC<LiveFeedProps> = ({ runs, onSelectRun }) => {
  return (
    <div className="apple-card p-6 mb-8">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-[#30D158] apple-live-dot" />
          <h3 className="text-sm font-semibold text-white tracking-wide">Live Activity Feed</h3>
        </div>
        <span className="text-xs font-mono text-slate-400">
          Showing {runs.length} workflow events
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs font-sans">
          <thead>
            <tr className="border-b border-white/10 text-slate-400 font-mono text-[11px] uppercase tracking-wider">
              <th className="pb-3 px-3">Status</th>
              <th className="pb-3 px-3">Repository & Branch</th>
              <th className="pb-3 px-3">Workflow Name</th>
              <th className="pb-3 px-3">Author & Commit</th>
              <th className="pb-3 px-3">Failed Step</th>
              <th className="pb-3 px-3">Duration</th>
              <th className="pb-3 px-3 text-right">Inspect</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 text-slate-300">
            {runs.map((run) => {
              const isFailed = run.status === 'failed';

              return (
                <tr 
                  key={run.id}
                  onClick={() => onSelectRun(run)}
                  className={`hover:bg-white/5 cursor-pointer transition-colors ${
                    isFailed ? 'bg-[#FF453A]/5' : ''
                  }`}
                >
                  {/* Status */}
                  <td className="py-3 px-3">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-semibold text-[10px] uppercase tracking-wider ${
                      isFailed ? 'bg-[#FF453A]/15 text-[#FF453A] border border-[#FF453A]/30' : 'bg-[#30D158]/15 text-[#30D158] border border-[#30D158]/30'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${isFailed ? 'bg-[#FF453A]' : 'bg-[#30D158]'}`} />
                      {run.status}
                    </span>
                  </td>

                  {/* Repo & Branch */}
                  <td className="py-3 px-3 font-mono font-medium text-slate-200">
                    <div className="flex items-center gap-2">
                      <span className="text-white hover:underline">{run.repository}</span>
                      <span className="text-[10px] text-slate-400 bg-white/5 px-1.5 py-0.5 rounded border border-white/10 flex items-center gap-0.5">
                        <GitBranch className="w-2.5 h-2.5" />
                        {run.branch}
                      </span>
                    </div>
                  </td>

                  {/* Workflow */}
                  <td className="py-3 px-3 font-medium text-white">
                    {run.workflow_name}
                  </td>

                  {/* Author */}
                  <td className="py-3 px-3 font-mono text-slate-400">
                    <span>@{run.author}</span>
                    <span className="ml-2 bg-white/10 text-slate-300 px-1 py-0.5 rounded text-[10px]">
                      {run.commit_sha}
                    </span>
                  </td>

                  {/* Failed Step */}
                  <td className="py-3 px-3 font-mono text-xs">
                    {isFailed ? (
                      <span className="text-[#FF453A] font-semibold bg-[#FF453A]/10 px-2 py-0.5 rounded border border-[#FF453A]/20">
                        {run.failed_step || 'Error in step execution'}
                      </span>
                    ) : (
                      <span className="text-slate-500">—</span>
                    )}
                  </td>

                  {/* Duration */}
                  <td className="py-3 px-3 font-mono text-slate-400">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-500" />
                      {run.duration_seconds}s
                    </span>
                  </td>

                  {/* Action */}
                  <td className="py-3 px-3 text-right">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectRun(run);
                      }}
                      className="inline-flex items-center gap-1 text-xs text-[#0A84FF] hover:underline font-semibold"
                    >
                      <Terminal className="w-3.5 h-3.5" />
                      <span>Trace</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </td>

                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

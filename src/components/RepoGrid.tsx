import React from 'react';
import { Repository, WorkflowRun } from '../types';
import { 
  GitBranch, 
  User, 
  Terminal, 
  Search, 
  X, 
  AlertTriangle 
} from 'lucide-react';

interface RepoGridProps {
  repositories: Repository[];
  recentRuns: WorkflowRun[];
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onSelectRun: (run: WorkflowRun) => void;
}

export const RepoGrid: React.FC<RepoGridProps> = ({
  repositories,
  recentRuns,
  searchQuery,
  setSearchQuery,
  onSelectRun
}) => {
  return (
    <div className="theme-card p-5 flex flex-col justify-between h-full shadow-sm">
      
      {/* Header Row */}
      <div className="flex items-center justify-between gap-3 mb-4 pb-3 border-b border-[var(--border-color)] flex-wrap sm:flex-nowrap">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-bold tracking-wide text-[var(--text-primary)]">
            Repository Matrix
          </h2>
          <span className="text-[10px] font-mono text-[var(--text-secondary)] theme-card-inner px-2 py-0.5 rounded-full font-semibold">
            {repositories.length} Repos
          </span>
        </div>

        {/* Search Bar */}
        <div className="relative w-full sm:w-56">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" />
          <input
            type="text"
            placeholder="Search repos, steps..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-7 py-1.5 bg-[var(--bg-card-inner)] border border-[var(--border-color)] rounded-xl text-xs text-[var(--text-primary)] placeholder-[var(--text-secondary)] focus:outline-none focus:border-[#0A84FF] font-sans"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Internally Scrollable Table Body */}
      <div className="overflow-y-auto max-h-[420px] pr-1">
        {repositories.length === 0 ? (
          <div className="py-12 text-center text-[var(--text-muted)] text-xs font-mono">
            No repositories found matching search.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs font-sans">
              <thead>
                <tr className="border-b border-[var(--border-color)] text-[var(--text-primary)] font-mono text-xs font-extrabold uppercase tracking-wider">
                  <th className="pb-2 px-2 font-extrabold text-[var(--text-primary)]">Status</th>
                  <th className="pb-2 px-2 font-extrabold text-[var(--text-primary)]">Repo & Branch</th>
                  <th className="pb-2 px-2 font-extrabold text-[var(--text-primary)]">Workflow Name</th>
                  <th className="pb-2 px-2 font-extrabold text-[var(--text-primary)]">Pass Rate</th>
                  <th className="pb-2 px-2 text-right font-extrabold text-[var(--text-primary)]">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-color)] text-[var(--text-primary)]">
                {repositories.map((repo) => {
                  const isFailed = repo.current_status === 'failed';
                  
                  const latestRun = recentRuns.find(r => r.repository.toLowerCase() === repo.name.toLowerCase()) || {
                    id: repo.last_run?.id || 'unknown',
                    run_id: '987654321',
                    repository: repo.name,
                    branch: repo.default_branch,
                    commit_sha: repo.last_run?.commit_sha || 'main',
                    author: repo.last_run?.author || 'github-user',
                    workflow_name: repo.last_run?.workflow_name || 'CI/CD Pipeline',
                    status: repo.current_status,
                    conclusion: repo.current_status === 'passed' ? 'success' : 'failure',
                    run_url: `https://github.com/${repo.name}`,
                    failed_job: repo.last_run?.failed_job || null,
                    failed_step: repo.last_run?.failed_step || null,
                    raw_logs: null,
                    clean_error: null,
                    timestamp: repo.last_run_timestamp,
                    duration_seconds: repo.last_run?.duration_seconds || 120
                  };

                  return (
                    <tr 
                      key={repo.id}
                      onClick={() => onSelectRun(latestRun as WorkflowRun)}
                      className={`table-row-hover cursor-pointer transition-colors ${
                        isFailed ? 'bg-[#FF453A]/5' : ''
                      }`}
                    >
                      {/* Status: Pulsating red/green dot with no wordings */}
                      <td className="py-3 px-2 whitespace-nowrap">
                        <span 
                          className={`inline-flex items-center justify-center p-1.5 rounded-full ${
                            isFailed 
                              ? 'bg-[#FF453A]/15 border border-[#FF453A]/30' 
                              : 'bg-[#30D158]/15 border border-[#30D158]/30'
                          }`}
                          title={isFailed ? 'Status: Failed' : 'Status: Passed'}
                        >
                          <span className={`w-2.5 h-2.5 rounded-full live-dot-blinking ${
                            isFailed ? 'bg-[#FF453A]' : 'bg-[#30D158]'
                          }`} />
                        </span>
                      </td>

                      {/* Repo Name & Branch */}
                      <td className="py-3 px-2 font-mono text-xs">
                        <div className="font-bold text-current truncate max-w-[170px]" title={repo.name}>
                          {repo.name}
                        </div>
                        <div className="flex items-center gap-1 text-[10px] text-[var(--text-secondary)] mt-0.5">
                          <GitBranch className="w-2.5 h-2.5 text-[var(--text-secondary)]" />
                          <span>{repo.default_branch}</span>
                        </div>
                      </td>

                      {/* Workflow Name */}
                      <td className="py-3 px-2 text-xs">
                        <div className="font-semibold text-current truncate max-w-[150px]">
                          {latestRun.workflow_name}
                        </div>
                        <div className="text-[10px] font-mono text-[var(--text-secondary)]">
                          {latestRun.duration_seconds}s
                        </div>
                      </td>

                      {/* Pass Rate */}
                      <td className="py-3 px-2 font-mono text-xs whitespace-nowrap">
                        <span className="font-bold text-current">{repo.pass_rate}%</span>
                      </td>

                      {/* Action: Circular 'i' button with no wordings (Red for inspect, Green for logs) */}
                      <td className="py-3 px-2 text-right whitespace-nowrap">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectRun(latestRun as WorkflowRun);
                          }}
                          title={isFailed ? 'Inspect Failure Trace' : 'View Workflow Logs'}
                          className={`w-7 h-7 rounded-full inline-flex items-center justify-center font-serif italic font-bold text-xs shadow-sm transition-all hover:scale-110 ml-auto ${
                            isFailed 
                              ? 'bg-[#FF453A] hover:bg-[#E0382F] text-white' 
                              : 'bg-[#30D158] hover:bg-[#25B046] text-white'
                          }`}
                        >
                          i
                        </button>
                      </td>

                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
};

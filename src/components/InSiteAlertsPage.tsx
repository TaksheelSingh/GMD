import React from 'react';
import { SiteAlert } from '../types';
import { 
  AlertTriangle, 
  CheckCircle2, 
  Info, 
  CheckCheck,
  Terminal,
  GitBranch,
  User,
  Clock
} from 'lucide-react';

interface InSiteAlertsPageProps {
  alerts: SiteAlert[];
  onMarkAllAsRead: () => void;
  onSelectRunById: (runId: string) => void;
}

export const InSiteAlertsPage: React.FC<InSiteAlertsPageProps> = ({
  alerts,
  onMarkAllAsRead,
  onSelectRunById
}) => {
  const unreadCount = alerts.filter(a => !a.is_read).length;

  return (
    <div className="space-y-6">
      
      {/* Page Header (Matching Dashboard Header Architecture) */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-[var(--border-color)]">
        <div>
          <h1 className="text-3xl font-extrabold text-[var(--text-primary)] tracking-tight flex items-center gap-3">
            <span>In-Site Telemetry Alerts</span>
            {unreadCount > 0 && (
              <span className="text-xs bg-[#FF453A] text-white font-bold px-2.5 py-0.5 rounded-full">
                {unreadCount} Unread
              </span>
            )}
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1 font-normal">
            Site-only live operational alert feed (No external Slack or email dependencies)
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={onMarkAllAsRead}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[var(--bg-card-inner)] hover:border-[var(--border-hover)] border border-[var(--border-color)] text-xs font-semibold text-[var(--text-primary)] transition-all cursor-pointer"
          >
            <CheckCheck className="w-4 h-4 text-[#30D158]" />
            <span>Mark All as Read</span>
          </button>
        )}
      </div>

      {/* Row-Wise Data Table Container with Horizontal & Vertical Scroll */}
      <div className="theme-card p-6 overflow-hidden">
        {alerts.length === 0 ? (
          <div className="text-center py-12 text-[var(--text-muted)] text-xs font-mono">
            No telemetry alerts recorded yet.
          </div>
        ) : (
          <div className="overflow-x-auto overflow-y-auto max-h-[600px]">
            <table className="w-full text-left border-collapse text-xs font-sans min-w-[800px]">
              <thead>
                <tr className="border-b border-[var(--border-color)] text-[var(--text-primary)] font-mono text-xs font-extrabold uppercase tracking-wider">
                  <th className="pb-3 px-4 font-extrabold text-[var(--text-primary)]">Status</th>
                  <th className="pb-3 px-4 font-extrabold text-[var(--text-primary)]">Repository & Branch</th>
                  <th className="pb-3 px-4 font-extrabold text-[var(--text-primary)]">Workflow Name</th>
                  <th className="pb-3 px-4 font-extrabold text-[var(--text-primary)]">Failed Step</th>
                  <th className="pb-3 px-4 font-extrabold text-[var(--text-primary)]">Author & SHA</th>
                  <th className="pb-3 px-4 font-extrabold text-[var(--text-primary)]">Time</th>
                  <th className="pb-3 px-4 text-right font-extrabold text-[var(--text-primary)]">Inspect</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-color)] text-[var(--text-primary)]">
                {alerts.map((alert) => {
                  const isFailure = alert.type === 'build_failure';
                  const isRecovery = alert.type === 'build_recovery';

                  return (
                    <tr 
                      key={alert.id}
                      onClick={() => onSelectRunById(alert.run_id)}
                      className={`table-row-hover cursor-pointer transition-colors ${
                        !alert.is_read ? 'font-semibold' : 'opacity-80'
                      }`}
                    >
                      {/* Status: Pulsating red/green dot with no wordings */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <span 
                          className={`inline-flex items-center justify-center p-1.5 rounded-full ${
                            isFailure 
                              ? 'bg-[#FF453A]/15 border border-[#FF453A]/30' 
                              : (isRecovery 
                                ? 'bg-[#30D158]/15 border border-[#30D158]/30' 
                                : 'bg-[#0A84FF]/15 border border-[#0A84FF]/30')
                          }`}
                          title={isFailure ? 'Build Failure' : (isRecovery ? 'Recovered' : 'System Alert')}
                        >
                          <span className={`w-2.5 h-2.5 rounded-full live-dot-blinking ${
                            isFailure 
                              ? 'bg-[#FF453A]' 
                              : (isRecovery ? 'bg-[#30D158]' : 'bg-[#0A84FF]')
                          }`} />
                        </span>
                      </td>

                      {/* Repo & Branch */}
                      <td className="py-4 px-4 font-mono whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-current">{alert.repository}</span>
                          <span className="text-[10px] text-[var(--text-secondary)] theme-card-inner px-1.5 py-0.5 rounded flex items-center gap-0.5">
                            <GitBranch className="w-2.5 h-2.5" />
                            {alert.branch}
                          </span>
                        </div>
                      </td>

                      {/* Workflow Name */}
                      <td className="py-4 px-4 font-medium whitespace-nowrap">
                        {alert.workflow_name}
                      </td>

                      {/* Failed Step */}
                      <td className="py-4 px-4 font-mono text-xs whitespace-nowrap">
                        {alert.failed_step ? (
                          <span className="text-[#FF453A] font-semibold bg-[#FF453A]/10 px-2 py-0.5 rounded border border-[#FF453A]/20">
                            {alert.failed_step}
                          </span>
                        ) : (
                          <span className="text-[var(--text-muted)]">—</span>
                        )}
                      </td>

                      {/* Author & SHA */}
                      <td className="py-4 px-4 font-mono text-xs text-[var(--text-secondary)] whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <User className="w-3 h-3 text-[var(--text-muted)]" />
                          <span>@{alert.author || 'dev'}</span>
                          {alert.commit_sha && (
                            <span className="bg-black/10 dark:bg-white/10 text-current px-1 py-0.5 rounded text-[10px]">
                              {alert.commit_sha}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Timestamp */}
                      <td className="py-4 px-4 font-mono text-[11px] text-[var(--text-secondary)] whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-[var(--text-muted)]" />
                          <span>{new Date(alert.timestamp).toLocaleTimeString()}</span>
                        </div>
                      </td>

                      {/* Inspect Action: Yellow circular button with 'i' and no wordings */}
                      <td className="py-4 px-4 text-right whitespace-nowrap">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectRunById(alert.run_id);
                          }}
                          title="Inspect Telemetry Trace"
                          className="w-7 h-7 rounded-full bg-[#FF9F0A] hover:bg-[#E08600] text-white inline-flex items-center justify-center font-serif italic font-bold text-xs shadow-sm transition-all hover:scale-110 ml-auto"
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

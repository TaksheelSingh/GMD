import React, { useState } from 'react';
import { SiteAlert } from '../types';
import { 
  Bell, 
  X, 
  CheckCircle2, 
  AlertTriangle, 
  Info, 
  Terminal, 
  CheckCheck,
  Volume2
} from 'lucide-react';

interface InSiteAlertDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  alerts: SiteAlert[];
  onMarkAllAsRead: () => void;
  onSelectRunById: (runId: string) => void;
}

export const InSiteAlertDrawer: React.FC<InSiteAlertDrawerProps> = ({
  isOpen,
  onClose,
  alerts,
  onMarkAllAsRead,
  onSelectRunById
}) => {
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  if (!isOpen) return null;

  const filteredAlerts = filter === 'unread' 
    ? alerts.filter(a => !a.is_read) 
    : alerts;

  const unreadCount = alerts.filter(a => !a.is_read).length;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm transition-opacity">
      <div className="w-full max-w-md bg-slate-900 border-l border-white/10 h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-300">
        
        {/* Header */}
        <div className="p-5 border-b border-white/10 flex items-center justify-between bg-white/5">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-[#FF453A]/10 text-[#FF453A] border border-[#FF453A]/20">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white tracking-tight flex items-center gap-2">
                In-Site Alert Center
                {unreadCount > 0 && (
                  <span className="text-[10px] bg-[#FF453A] text-white font-bold px-2 py-0.5 rounded-full">
                    {unreadCount}
                  </span>
                )}
              </h2>
              <p className="text-xs text-slate-400">Site-Only Telemetry Notifications</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/15 border border-white/10 text-slate-300 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Controls */}
        <div className="px-5 py-2.5 bg-black/30 border-b border-white/5 flex items-center justify-between">
          <div className="segmented-control">
            <button
              onClick={() => setFilter('all')}
              className={`segmented-control-item ${filter === 'all' ? 'active' : ''}`}
            >
              All ({alerts.length})
            </button>
            <button
              onClick={() => setFilter('unread')}
              className={`segmented-control-item ${filter === 'unread' ? 'active' : ''}`}
            >
              Unread ({unreadCount})
            </button>
          </div>

          {unreadCount > 0 && (
            <button
              onClick={onMarkAllAsRead}
              className="flex items-center gap-1 text-xs text-[#0A84FF] hover:underline font-medium"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              <span>Mark all read</span>
            </button>
          )}
        </div>

        {/* Notice Banner */}
        <div className="mx-5 mt-4 p-3 rounded-xl bg-[#0A84FF]/10 border border-[#0A84FF]/20 text-xs text-slate-300 flex items-center gap-2">
          <Volume2 className="w-4 h-4 text-[#0A84FF] flex-shrink-0" />
          <span>In-site notifications active (No external Slack/email messages).</span>
        </div>

        {/* Alert List Feed */}
        <div className="flex-1 p-5 overflow-y-auto space-y-3">
          {filteredAlerts.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-xs font-mono">
              No alerts matching criteria.
            </div>
          ) : (
            filteredAlerts.map((alert) => {
              const isFailure = alert.type === 'build_failure';
              const isRecovery = alert.type === 'build_recovery';

              return (
                <div
                  key={alert.id}
                  className={`p-4 rounded-xl border transition-all ${
                    !alert.is_read 
                      ? (isFailure ? 'bg-[#FF453A]/10 border-[#FF453A]/30' : 'bg-[#30D158]/10 border-[#30D158]/30') 
                      : 'bg-white/5 border-white/5 opacity-75'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-1.5">
                      {isFailure && <AlertTriangle className="w-4 h-4 text-[#FF453A]" />}
                      {isRecovery && <CheckCircle2 className="w-4 h-4 text-[#30D158]" />}
                      {!isFailure && !isRecovery && <Info className="w-4 h-4 text-[#0A84FF]" />}

                      <span className={`text-xs font-semibold ${
                        isFailure ? 'text-[#FF453A]' : (isRecovery ? 'text-[#30D158]' : 'text-[#0A84FF]')
                      }`}>
                        {isFailure ? 'Build Failure' : (isRecovery ? 'Pipeline Recovered' : 'System Alert')}
                      </span>
                    </div>

                    <span className="text-[10px] font-mono text-slate-400">
                      {new Date(alert.timestamp).toLocaleTimeString()}
                    </span>
                  </div>

                  <div className="space-y-1 mb-3">
                    <div className="font-mono text-xs font-semibold text-white">
                      {alert.repository} <span className="text-slate-400 font-normal">({alert.branch})</span>
                    </div>

                    <p className="text-xs text-slate-300">
                      Workflow: <span className="font-medium text-[#0A84FF]">{alert.workflow_name}</span>
                    </p>

                    {alert.failed_step && (
                      <p className="text-xs text-[#FF453A] font-mono bg-[#FF453A]/10 px-2 py-0.5 rounded border border-[#FF453A]/20">
                        Step: {alert.failed_step}
                      </p>
                    )}

                    {alert.clean_error && (
                      <div className="bg-black border border-white/10 rounded p-2 text-[11px] font-mono text-slate-300 line-clamp-3 overflow-hidden">
                        {alert.clean_error}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-white/5 text-xs">
                    <span className="text-[10px] font-mono text-slate-400">
                      @{alert.author || 'dev'}
                    </span>

                    <button
                      onClick={() => {
                        onSelectRunById(alert.run_id);
                        onClose();
                      }}
                      className="flex items-center gap-1 text-xs font-semibold text-[#0A84FF] hover:underline"
                    >
                      <Terminal className="w-3.5 h-3.5" />
                      <span>Inspect Trace</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-white/5 border-t border-white/10 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-white text-xs font-medium transition-colors"
          >
            Done
          </button>
        </div>

      </div>
    </div>
  );
};

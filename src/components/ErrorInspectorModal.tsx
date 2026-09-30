import React, { useState } from 'react';
import { WorkflowRun } from '../types';
import { 
  X, 
  Terminal, 
  Copy, 
  Check, 
  ExternalLink, 
  AlertTriangle, 
  Code, 
  FileText, 
  GitBranch, 
  User, 
  Clock 
} from 'lucide-react';

interface ErrorInspectorModalProps {
  run: WorkflowRun | null;
  onClose: () => void;
}

export const ErrorInspectorModal: React.FC<ErrorInspectorModalProps> = ({ run, onClose }) => {
  const [activeTab, setActiveTab] = useState<'clean' | 'raw' | 'json'>('clean');
  const [copied, setCopied] = useState(false);

  if (!run) return null;

  const isFailed = run.status === 'failed';

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md transition-opacity">
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-[#1c1c1e] border border-white/10 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        
        {/* macOS Style Window Header */}
        <div className="p-5 border-b border-white/10 bg-white/5 flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5 mb-1.5">
              <span className={`inline-flex items-center justify-center p-1.5 rounded-full ${
                isFailed ? 'bg-[#FF453A]/20 border border-[#FF453A]/30' : 'bg-[#30D158]/20 border border-[#30D158]/30'
              }`} title={isFailed ? 'Failed' : 'Passed'}>
                <span className={`w-2.5 h-2.5 rounded-full live-dot-blinking ${isFailed ? 'bg-[#FF453A]' : 'bg-[#30D158]'}`} />
              </span>

              <span className="font-mono text-sm font-semibold text-white">{run.repository}</span>
              <span className="text-[11px] font-mono text-slate-400 bg-white/5 border border-white/10 px-2 py-0.5 rounded flex items-center gap-1">
                <GitBranch className="w-3 h-3 text-slate-500" />
                {run.branch}
              </span>
            </div>

            <h2 className="text-lg font-bold text-white tracking-tight">
              {run.workflow_name}
            </h2>

            {isFailed && run.failed_step && (
              <div className="mt-2 inline-flex items-center gap-2 px-2.5 py-1 rounded-lg bg-[#FF453A]/10 border border-[#FF453A]/25 text-xs font-mono text-[#FF453A]">
                <span className="font-semibold">Failed Step:</span>
                <span>{run.failed_step}</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <a
              href={run.run_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 border border-white/10 text-white text-xs font-medium transition-colors"
            >
              <span>GitHub</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-white/10 hover:bg-white/15 border border-white/10 text-slate-300 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Metadata Strip */}
        <div className="px-5 py-2.5 bg-black/30 border-b border-white/5 flex items-center justify-between text-xs text-slate-400 font-mono">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <User className="w-3.5 h-3.5 text-slate-500" />
              <span>@{run.author}</span>
            </span>
            <span className="bg-white/10 text-slate-300 px-1.5 py-0.5 rounded text-[11px]">
              SHA: {run.commit_sha}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-slate-500" />
              <span>{run.duration_seconds}s</span>
            </span>
            {run.matched_pattern && (
              <span className="text-[#FF453A] bg-[#FF453A]/10 px-2 py-0.5 rounded text-[11px]">
                {run.matched_pattern}
              </span>
            )}
          </div>
        </div>

        {/* macOS Segmented Control Tabs */}
        <div className="px-5 py-3 bg-white/5 border-b border-white/5 flex items-center justify-between">
          <div className="segmented-control">
            <button
              onClick={() => setActiveTab('clean')}
              className={`segmented-control-item flex items-center gap-1.5 ${activeTab === 'clean' ? 'active' : ''}`}
            >
              <Terminal className="w-3.5 h-3.5" />
              <span>Clean Error</span>
            </button>

            <button
              onClick={() => setActiveTab('raw')}
              className={`segmented-control-item flex items-center gap-1.5 ${activeTab === 'raw' ? 'active' : ''}`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Raw Terminal</span>
            </button>

            <button
              onClick={() => setActiveTab('json')}
              className={`segmented-control-item flex items-center gap-1.5 ${activeTab === 'json' ? 'active' : ''}`}
            >
              <Code className="w-3.5 h-3.5" />
              <span>JSON Payload</span>
            </button>
          </div>

          <button
            onClick={() => handleCopy(activeTab === 'clean' ? (run.clean_error || run.raw_logs || '') : (activeTab === 'raw' ? (run.raw_logs || '') : JSON.stringify(run, null, 2)))}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 border border-white/10 text-white text-xs font-mono transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-[#30D158]" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
        </div>

        {/* Terminal Window Container */}
        <div className="flex-1 p-5 overflow-y-auto bg-[#000000]">
          {activeTab === 'clean' && (
            <div className="font-mono text-xs text-slate-200 leading-relaxed bg-[#111113] border border-white/10 rounded-xl p-4 overflow-x-auto">
              {run.clean_error ? (
                <pre className="whitespace-pre-wrap">
                  {run.clean_error.split('\n').map((line, idx) => {
                    const isErrorLine = /error|fail|assertionerror|syntaxerror|fatal|panic/i.test(line);
                    return (
                      <div key={idx} className={`flex items-start gap-4 py-0.5 rounded px-1 ${
                        isErrorLine ? 'bg-[#FF453A]/15 text-[#FF453A] font-semibold' : ''
                      }`}>
                        <span className="text-slate-600 select-none text-[11px] w-6 text-right font-mono">
                          {idx + 1}
                        </span>
                        <span className="flex-1">{line}</span>
                      </div>
                    );
                  })}
                </pre>
              ) : (
                <div className="text-[#30D158] font-mono py-4 text-center">
                  ✓ Pipeline completed without error traces. All steps passed cleanly.
                </div>
              )}
            </div>
          )}

          {activeTab === 'raw' && (
            <div className="font-mono text-xs text-slate-300 leading-relaxed bg-[#111113] border border-white/10 rounded-xl p-4 overflow-x-auto">
              <pre className="whitespace-pre-wrap">{run.raw_logs || 'No raw log data available.'}</pre>
            </div>
          )}

          {activeTab === 'json' && (
            <div className="font-mono text-xs text-[#0A84FF] bg-[#111113] border border-white/10 rounded-xl p-4 overflow-x-auto">
              <pre className="whitespace-pre-wrap">{JSON.stringify(run, null, 2)}</pre>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-white/5 border-t border-white/10 flex items-center justify-between text-xs text-slate-400">
          <span>Telemetry ID: {run.id}</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-[#0A84FF] hover:bg-[#0071E3] text-white font-semibold text-xs transition-colors"
          >
            Done
          </button>
        </div>

      </div>
    </div>
  );
};

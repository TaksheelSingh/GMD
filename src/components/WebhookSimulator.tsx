import React, { useState } from 'react';
import { 
  Play, 
  X, 
  Terminal, 
  CheckCircle2, 
  AlertTriangle, 
  Zap, 
  Layers,
  ArrowRight
} from 'lucide-react';

interface WebhookSimulatorProps {
  isOpen: boolean;
  onClose: () => void;
  onRunSimulation: (scenario: string, repository: string, branch: string) => Promise<void>;
}

export const WebhookSimulator: React.FC<WebhookSimulatorProps> = ({
  isOpen,
  onClose,
  onRunSimulation
}) => {
  const [selectedScenario, setSelectedScenario] = useState<string>('jest_failure');
  const [repository, setRepository] = useState<string>('octocat/auth-microservice');
  const [branch, setBranch] = useState<string>('main');
  const [loading, setLoading] = useState<boolean>(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const scenarios = [
    {
      id: 'jest_failure',
      name: 'Jest Security Test Failure',
      tech: 'Node.js / React',
      description: 'Simulates AssertionError in JWT token expiration test suite.',
      icon: Terminal,
      color: 'text-[#FF453A] border-[#FF453A]/30 bg-[#FF453A]/10'
    },
    {
      id: 'typescript_error',
      name: 'TypeScript Compiler Error (tsc)',
      tech: 'TypeScript',
      description: 'Simulates TS2345 type error during production build check.',
      icon: Layers,
      color: 'text-[#FF9F0A] border-[#FF9F0A]/30 bg-[#FF9F0A]/10'
    },
    {
      id: 'docker_error',
      name: 'Docker Build & Push Failure',
      tech: 'Docker / CI',
      description: 'Simulates missing package module inside Docker image build step.',
      icon: AlertTriangle,
      color: 'text-[#BF5AF2] border-[#BF5AF2]/30 bg-[#BF5AF2]/10'
    },
    {
      id: 'pytest_error',
      name: 'PyTest Integration Failure',
      tech: 'Python PyTest',
      description: 'Simulates KeyError in Stripe webhook idempotency test.',
      icon: Zap,
      color: 'text-[#0A84FF] border-[#0A84FF]/30 bg-[#0A84FF]/10'
    },
    {
      id: 'success_run',
      name: 'Clean Pipeline Success',
      tech: 'All Stacks',
      description: 'Simulates 100% successful GitHub Actions execution.',
      icon: CheckCircle2,
      color: 'text-[#30D158] border-[#30D158]/30 bg-[#30D158]/10'
    }
  ];

  const handleSimulate = async () => {
    setLoading(true);
    setSuccessMsg(null);
    try {
      await onRunSimulation(selectedScenario, repository, branch);
      setSuccessMsg('⚡ Telemetry event dispatched! Dashboard updated.');
      setTimeout(() => {
        setSuccessMsg(null);
        onClose();
      }, 1200);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
      <div className="relative w-full max-w-lg bg-[#1c1c1e] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="p-5 border-b border-white/10 flex items-center justify-between bg-white/5">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-[#0A84FF]/10 text-[#0A84FF] border border-[#0A84FF]/20">
              <Play className="w-4 h-4 fill-current" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white tracking-tight">Webhook Simulator</h2>
              <p className="text-xs text-slate-400">Trigger test telemetry to evaluate error parser & site alerts</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/15 border border-white/10 text-slate-300 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 overflow-y-auto max-h-[70vh]">
          
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1 font-mono uppercase">
                Repository
              </label>
              <input
                type="text"
                value={repository}
                onChange={(e) => setRepository(e.target.value)}
                className="w-full px-3 py-1.5 bg-black/40 border border-white/10 rounded-lg text-xs font-mono text-white focus:outline-none focus:border-[#0A84FF]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1 font-mono uppercase">
                Branch
              </label>
              <input
                type="text"
                value={branch}
                onChange={(e) => setBranch(e.target.value)}
                className="w-full px-3 py-1.5 bg-black/40 border border-white/10 rounded-lg text-xs font-mono text-white focus:outline-none focus:border-[#0A84FF]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-2 font-mono uppercase">
              Select Test Scenario
            </label>

            <div className="space-y-2">
              {scenarios.map((sc) => {
                const Icon = sc.icon;
                const isSelected = selectedScenario === sc.id;

                return (
                  <div
                    key={sc.id}
                    onClick={() => setSelectedScenario(sc.id)}
                    className={`p-3 rounded-xl border cursor-pointer transition-all flex items-start justify-between gap-3 ${
                      isSelected 
                        ? 'bg-[#0A84FF]/10 border-[#0A84FF]' 
                        : 'bg-white/5 border-white/5 hover:border-white/15'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`p-1.5 rounded-lg border ${sc.color}`}>
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-xs text-white">{sc.name}</span>
                          <span className="text-[10px] font-mono text-slate-400 bg-white/10 px-1.5 py-0.2 rounded">
                            {sc.tech}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5">{sc.description}</p>
                      </div>
                    </div>

                    <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center mt-1 ${
                      isSelected ? 'border-[#0A84FF] bg-[#0A84FF]' : 'border-slate-600'
                    }`}>
                      {isSelected && <div className="w-1 h-1 rounded-full bg-white" />}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {successMsg && (
            <div className="p-3 rounded-xl bg-[#30D158]/10 border border-[#30D158]/20 text-xs font-mono text-[#30D158] flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>{successMsg}</span>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 bg-white/5 border-t border-white/10 flex items-center justify-between">
          <span className="text-xs text-slate-400 font-mono">
            Pushes real-time WS event
          </span>

          <button
            onClick={handleSimulate}
            disabled={loading}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-[#0A84FF] hover:bg-[#0071E3] text-white font-semibold text-xs transition-all disabled:opacity-50"
          >
            {loading ? (
              <span>Simulating...</span>
            ) : (
              <>
                <Zap className="w-3.5 h-3.5" />
                <span>Fire Event</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};

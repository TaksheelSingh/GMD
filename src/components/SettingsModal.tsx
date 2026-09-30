import React, { useState } from 'react';
import { 
  Settings, 
  X, 
  Key, 
  ShieldCheck, 
  Copy, 
  Check, 
  HelpCircle
} from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const [webhookSecret, setWebhookSecret] = useState('gmd_secret_key_123');
  const [githubPat, setGithubPat] = useState('');
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [saved, setSaved] = useState(false);

  if (!isOpen) return null;

  const payloadUrl = `${window.location.origin}/api/webhooks/github`;

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(payloadUrl);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  const handleSave = async () => {
    try {
      await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ webhookSecret, githubPat })
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
      <div className="relative w-full max-w-md bg-[#1c1c1e] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="p-5 border-b border-white/10 flex items-center justify-between bg-white/5">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-[#0A84FF]/10 text-[#0A84FF] border border-[#0A84FF]/20">
              <Settings className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white tracking-tight">Integration Settings</h2>
              <p className="text-xs text-slate-400">Configure Webhook secret key & GitHub access token</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/15 border border-white/10 text-slate-300 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          
          <div className="bg-black/30 border border-white/10 rounded-xl p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-300 font-mono uppercase">
                Webhook Payload URL
              </label>
              <button
                onClick={handleCopyUrl}
                className="flex items-center gap-1 text-[11px] font-mono text-[#0A84FF] hover:underline"
              >
                {copiedUrl ? <Check className="w-3.5 h-3.5 text-[#30D158]" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedUrl ? 'Copied' : 'Copy URL'}</span>
              </button>
            </div>

            <div className="bg-[#000000] px-3 py-1.5 rounded-lg font-mono text-xs text-[#0A84FF] border border-white/10 break-all select-all">
              {payloadUrl}
            </div>

            <p className="text-[11px] text-slate-400 flex items-center gap-1">
              <HelpCircle className="w-3 h-3 text-slate-500" />
              Add in GitHub Repo Settings $\rightarrow$ Webhooks
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1 font-mono uppercase">
              HMAC SHA-256 Secret Key
            </label>
            <div className="relative">
              <Key className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                value={webhookSecret}
                onChange={(e) => setWebhookSecret(e.target.value)}
                placeholder="Enter shared secret..."
                className="w-full pl-9 pr-4 py-1.5 bg-black/40 border border-white/10 rounded-lg text-xs font-mono text-white focus:outline-none focus:border-[#0A84FF]"
              />
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Verifies <code className="text-slate-400">X-Hub-Signature-256</code> headers.</p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1 font-mono uppercase">
              Read-Only Personal Access Token (PAT)
            </label>
            <div className="relative">
              <ShieldCheck className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="password"
                value={githubPat}
                onChange={(e) => setGithubPat(e.target.value)}
                placeholder="ghp_xxxxxxxxxxxxxxxxxxxx (Optional)"
                className="w-full pl-9 pr-4 py-1.5 bg-black/40 border border-white/10 rounded-lg text-xs font-mono text-white focus:outline-none focus:border-[#0A84FF]"
              />
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Requires only <code className="text-slate-400">actions:read</code> scope.</p>
          </div>

          {saved && (
            <div className="p-3 rounded-xl bg-[#30D158]/10 border border-[#30D158]/20 text-xs font-mono text-[#30D158]">
              ✓ Settings saved.
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 bg-white/5 border-t border-white/10 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-slate-300 font-medium text-xs transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-3.5 py-1.5 rounded-lg bg-[#0A84FF] hover:bg-[#0071E3] text-white font-semibold text-xs transition-colors"
          >
            Save Settings
          </button>
        </div>

      </div>
    </div>
  );
};

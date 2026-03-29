'use client';

import { useState, useEffect } from 'react';
import { Key, Cpu, ExternalLink, Info, MessageCircle } from 'lucide-react';

const MODELS = [
  { value: 'gemini-3-flash-preview', label: 'Gemini 3 Flash' },
  { value: 'gemini-3.1-pro-preview', label: 'Gemini 3.1 Pro' },
  { value: 'gemini-3.1-flash-lite-preview', label: 'Gemini 3.1 Flash Lite' },
];

function maskKey(key: string | undefined): string {
  if (!key) return 'Not configured';
  if (key.length <= 8) return '****';
  return key.slice(0, 4) + '...' + key.slice(-3);
}

const CHAT_SYSTEM_INSTRUCTION_KEY = 'chat-system-instruction';

export default function SettingsPage() {
  const [defaultModel, setDefaultModel] = useState(MODELS[0].value);
  const [chatSystemInstruction, setChatSystemInstruction] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(CHAT_SYSTEM_INSTRUCTION_KEY);
    if (stored) setChatSystemInstruction(stored);
  }, []);

  const handleSaveInstruction = () => {
    const trimmed = chatSystemInstruction.trim();
    if (trimmed) {
      localStorage.setItem(CHAT_SYSTEM_INSTRUCTION_KEY, trimmed);
    } else {
      localStorage.removeItem(CHAT_SYSTEM_INSTRUCTION_KEY);
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  // API key is server-side only; we show a masked placeholder
  const apiKeyDisplay = maskKey(typeof window !== 'undefined' ? undefined : undefined);

  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <h1 className="text-xl font-semibold text-[var(--text-primary)]">Settings</h1>
        <p className="text-sm text-[var(--text-muted)] mt-1">Configuration and status</p>
      </div>

      <div className="space-y-4">
        {/* API Key status */}
        <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-subtle)] flex items-center justify-center">
              <Key size={15} className="text-[var(--amber)]" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-[var(--text-primary)]">API Key</h3>
              <p className="text-xs text-[var(--text-muted)]">Gemini API authentication</p>
            </div>
          </div>
          <div className="bg-[var(--bg-elevated)] rounded-lg px-3 py-2.5 border border-[var(--border-subtle)]">
            <p className="text-sm font-mono text-[var(--text-secondary)]">{apiKeyDisplay}</p>
          </div>
          <p className="text-xs text-[var(--text-muted)] mt-2">
            Set via <code className="font-mono text-[var(--amber)] bg-[var(--amber-glow)] px-1 py-0.5 rounded text-[11px]">GEMINI_API_KEY</code> environment variable.
          </p>
        </div>

        {/* Default model */}
        <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-subtle)] flex items-center justify-center">
              <Cpu size={15} className="text-[var(--amber)]" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-[var(--text-primary)]">Default Model</h3>
              <p className="text-xs text-[var(--text-muted)]">Used for queries when not overridden</p>
            </div>
          </div>
          <select
            value={defaultModel}
            onChange={(e) => setDefaultModel(e.target.value)}
            className="w-full bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-lg px-3 py-2.5 text-sm text-[var(--text-primary)] focus:border-[var(--amber)] focus:outline-none cursor-pointer transition-colors"
          >
            {MODELS.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
          <div className="mt-4 p-4 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-subtle)]">
            <div className="flex items-start gap-3">
              <Info size={14} className="text-[var(--amber)] mt-0.5 shrink-0" />
              <div className="text-xs text-[var(--text-secondary)] leading-relaxed space-y-1">
                <div><strong className="text-[var(--text-primary)]">Context:</strong> 32K tokens</div>
                <div><strong className="text-[var(--text-primary)]">Speed:</strong> ~850ms avg response</div>
                <div><strong className="text-[var(--text-primary)]">Best for:</strong> Fast queries, summaries</div>
              </div>
            </div>
          </div>
        </div>

        {/* Chat system instruction */}
        <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-subtle)] flex items-center justify-center">
              <MessageCircle size={15} className="text-[var(--amber)]" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-[var(--text-primary)]">Chat System Instruction</h3>
              <p className="text-xs text-[var(--text-muted)]">Custom instructions sent with every chat message</p>
            </div>
          </div>
          <textarea
            value={chatSystemInstruction}
            onChange={(e) => { setChatSystemInstruction(e.target.value); setSaved(false); }}
            placeholder="e.g. You are a helpful assistant. Always respond in bullet points."
            rows={4}
            className="w-full bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-lg px-3 py-2.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] resize-none focus:border-[var(--amber)] focus:outline-none transition-colors"
          />
          <div className="flex items-center justify-between mt-3">
            <p className="text-xs text-[var(--text-muted)]">
              Leave empty to use no system instruction. Applied to new messages only.
            </p>
            <button
              onClick={handleSaveInstruction}
              className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 cursor-pointer ${
                saved
                  ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                  : 'bg-[var(--amber)] text-[var(--bg-primary)] hover:bg-[var(--amber-dim)] shadow-[0_0_12px_var(--amber-glow)]'
              }`}
            >
              {saved ? 'Saved' : 'Save'}
            </button>
          </div>
        </div>

        {/* Documentation links */}
        <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5">
          <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3">Documentation</h3>
          <div className="space-y-2">
            {[
              { label: 'Gemini File Search API', href: 'https://ai.google.dev/gemini-api/docs/file-search' },
              { label: 'Google AI SDK', href: 'https://www.npmjs.com/package/@google/genai' },
            ].map((link) => (
              <a
                key={link.href}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-[var(--text-secondary)] hover:text-[var(--amber)] transition-colors"
              >
                <ExternalLink size={13} />
                {link.label}
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

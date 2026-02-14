'use client';

import { useState } from 'react';
import { Key, Cpu, ExternalLink } from 'lucide-react';

const MODELS = [
  { value: 'gemini-3-flash-preview', label: 'Gemini 3 Flash' },
  { value: 'gemini-3-pro-preview', label: 'Gemini 3 Pro' },
];

function maskKey(key: string | undefined): string {
  if (!key) return 'Not configured';
  if (key.length <= 8) return '****';
  return key.slice(0, 4) + '...' + key.slice(-3);
}

export default function SettingsPage() {
  const [defaultModel, setDefaultModel] = useState(MODELS[0].value);

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

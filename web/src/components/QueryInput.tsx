'use client';

import { useState } from 'react';
import { Send, Loader2 } from 'lucide-react';

interface QueryInputProps {
  onSubmit: (query: string) => void;
  loading?: boolean;
}

export default function QueryInput({ onSubmit, loading = false }: QueryInputProps) {
  const [value, setValue] = useState('');

  const handleSubmit = () => {
    const trimmed = value.trim();
    if (!trimmed || loading) return;
    onSubmit(trimmed);
  };

  return (
    <div className="relative">
      <textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
          }
        }}
        placeholder="Ask a question about your documents..."
        rows={4}
        className="w-full bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-xl px-4 py-3 pr-14 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] resize-none focus:border-[var(--amber)] focus:shadow-[0_0_20px_var(--amber-glow)] focus:outline-none transition-all duration-200"
      />
      <button
        onClick={handleSubmit}
        disabled={!value.trim() || loading}
        className={`
          absolute right-3 bottom-3 p-2.5 rounded-lg transition-all duration-200 cursor-pointer
          ${
            loading
              ? 'bg-[var(--amber)] shadow-[0_0_16px_var(--amber-glow)] animate-pulse'
              : value.trim()
                ? 'bg-[var(--amber)] hover:bg-[var(--amber-dim)] shadow-[0_0_12px_var(--amber-glow)]'
                : 'bg-[var(--bg-elevated)] text-[var(--text-muted)] cursor-not-allowed'
          }
        `}
      >
        {loading ? (
          <Loader2 size={16} className="text-[var(--bg-primary)] animate-spin" />
        ) : (
          <Send size={16} className={value.trim() ? 'text-[var(--bg-primary)]' : 'text-[var(--text-muted)]'} />
        )}
      </button>
    </div>
  );
}

'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Loader2 } from 'lucide-react';

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
}

export default function ChatInput({ onSend, disabled = false }: ChatInputProps) {
  const [value, setValue] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 200) + 'px';
  }, [value]);

  const handleSubmit = () => {
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setValue('');
  };

  return (
    <div className="relative max-w-3xl mx-auto w-full">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
          }
        }}
        placeholder="Send a message..."
        aria-label="Chat input"
        rows={1}
        className="w-full bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-xl px-4 py-3 pr-14 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] resize-none focus:border-[var(--amber)] focus:shadow-[0_0_20px_var(--amber-glow)] focus:outline-none transition-all duration-200"
      />
      <button
        onClick={handleSubmit}
        disabled={!value.trim() || disabled}
        className={`
          absolute right-3 bottom-3 p-2.5 rounded-lg transition-all duration-200 cursor-pointer
          ${
            disabled
              ? 'bg-[var(--amber)] shadow-[0_0_16px_var(--amber-glow)] animate-pulse'
              : value.trim()
                ? 'bg-[var(--amber)] hover:bg-[var(--amber-dim)] shadow-[0_0_12px_var(--amber-glow)]'
                : 'bg-[var(--bg-elevated)] text-[var(--text-muted)] cursor-not-allowed'
          }
        `}
      >
        {disabled ? (
          <Loader2 size={16} className="text-[var(--bg-primary)] animate-spin" />
        ) : (
          <Send size={16} className={value.trim() ? 'text-[var(--bg-primary)]' : 'text-[var(--text-muted)]'} />
        )}
      </button>
    </div>
  );
}

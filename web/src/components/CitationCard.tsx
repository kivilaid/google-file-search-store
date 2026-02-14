'use client';

import { useState } from 'react';
import { ChevronDown, ExternalLink } from 'lucide-react';

interface CitationCardProps {
  index: number;
  title?: string;
  uri?: string;
  snippet?: string;
  startIndex?: number;
  endIndex?: number;
}

export default function CitationCard({ index, title, uri, snippet, startIndex, endIndex }: CitationCardProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] overflow-hidden transition-all duration-200 hover:border-[var(--border-default)]">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 px-4 py-3 text-left cursor-pointer"
      >
        <span className="shrink-0 w-6 h-6 rounded-md bg-[var(--amber-glow)] flex items-center justify-center text-xs font-mono font-bold text-[var(--amber)]">
          {index}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm text-[var(--text-primary)] truncate">
            {title || uri || `Citation ${index}`}
          </p>
        </div>
        {uri && (
          <a
            href={uri}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="shrink-0 p-1 text-[var(--text-muted)] hover:text-[var(--amber)] transition-colors"
          >
            <ExternalLink size={13} />
          </a>
        )}
        <ChevronDown
          size={14}
          className={`shrink-0 text-[var(--text-muted)] transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
        />
      </button>

      {expanded && (
        <div className="px-4 pb-3 border-t border-[var(--border-subtle)]">
          {snippet && (
            <p className="mt-3 text-sm text-[var(--text-secondary)] leading-relaxed whitespace-pre-wrap">
              {snippet}
            </p>
          )}
          {(startIndex !== undefined || endIndex !== undefined) && (
            <p className="mt-2 text-[11px] font-mono text-[var(--text-muted)]">
              chars {startIndex ?? '?'}–{endIndex ?? '?'}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

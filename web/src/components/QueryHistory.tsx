'use client';

import { Clock, ChevronRight } from 'lucide-react';
import { formatRelativeTime } from '../lib/utils';

interface QueryHistoryItem {
  id: string;
  query: string;
  timestamp: string;
  storeNames?: string[];
}

interface QueryHistoryProps {
  queries: QueryHistoryItem[];
  onQuerySelect: (query: string) => void;
}

export default function QueryHistory({ queries, onQuerySelect }: QueryHistoryProps) {
  if (queries.length === 0) {
    return (
      <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-8 text-center">
        <Clock size={32} className="text-[var(--text-muted)] mx-auto mb-3" />
        <p className="text-sm text-[var(--text-muted)]">No query history yet</p>
        <p className="text-xs text-[var(--text-muted)] mt-1">Your recent queries will appear here</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <h3 className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider mb-3">
        Recent Queries
      </h3>
      {queries.map((item) => (
        <button
          key={item.id}
          onClick={() => onQuerySelect(item.query)}
          className="w-full rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4 text-left transition-all duration-200 hover:border-[var(--amber-dim)] hover:shadow-[0_0_16px_var(--amber-glow)] hover:-translate-y-0.5 cursor-pointer group"
        >
          <div className="flex items-start gap-3">
            <Clock size={14} className="text-[var(--text-muted)] mt-0.5 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm text-[var(--text-primary)] line-clamp-2 mb-1 group-hover:text-[var(--amber)] transition-colors">
                {item.query}
              </p>
              <p className="text-xs text-[var(--text-muted)]">
                {formatRelativeTime(new Date(item.timestamp))}
              </p>
            </div>
            <ChevronRight
              size={14}
              className="text-[var(--text-muted)] opacity-0 group-hover:opacity-100 group-hover:text-[var(--amber)] transition-all duration-200 shrink-0 mt-0.5"
            />
          </div>
        </button>
      ))}
    </div>
  );
}

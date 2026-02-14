'use client';

import { TrendingUp, TrendingDown } from 'lucide-react';
import { formatNumber, formatChange } from '../lib/utils';

interface UsageStatsProps {
  apiCalls: number;
  apiCallsChange: number;
  tokensUsed: number;
  tokensChange: number;
  loading?: boolean;
}

export default function UsageStats({
  apiCalls,
  apiCallsChange,
  tokensUsed,
  tokensChange,
  loading = false,
}: UsageStatsProps) {
  if (loading) {
    return (
      <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5">
        <div className="h-5 w-32 rounded bg-[var(--bg-elevated)] animate-pulse mb-4" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {[1, 2].map((i) => (
            <div key={i}>
              <div className="h-3 w-20 rounded bg-[var(--bg-elevated)] animate-pulse mb-2" />
              <div className="h-8 w-24 rounded bg-[var(--bg-elevated)] animate-pulse mb-1" />
              <div className="h-3 w-32 rounded bg-[var(--bg-elevated)] animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const stats = [
    {
      label: 'API CALLS',
      value: apiCalls,
      change: apiCallsChange,
    },
    {
      label: 'TOKENS USED',
      value: tokensUsed,
      change: tokensChange,
    },
  ];

  return (
    <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5">
      <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4">
        Usage This Month
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {stats.map((stat, index) => {
          const isPositive = stat.change >= 0;
          const Icon = isPositive ? TrendingUp : TrendingDown;
          return (
            <div key={index}>
              <div className="text-xs text-[var(--text-muted)] uppercase tracking-wider mb-2">
                {stat.label}
              </div>
              <div className="text-2xl font-bold text-[var(--text-primary)] mb-1">
                {formatNumber(stat.value)}
              </div>
              <div className={`flex items-center gap-1 text-xs ${
                isPositive ? 'text-[var(--success)]' : 'text-[var(--danger)]'
              }`}>
                <Icon size={12} />
                <span>{formatChange(stat.change)} from last month</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

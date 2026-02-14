'use client';

import { Database, FileText, HardDrive } from 'lucide-react';
import { formatNumber } from '../lib/utils';

interface StatsBarProps {
  totalStores: number;
  totalDocuments: number;
  totalStorage: string;
  loading?: boolean;
}

export default function StatsBar({ totalStores, totalDocuments, totalStorage, loading = false }: StatsBarProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5">
            <div className="h-6 w-20 rounded bg-[var(--bg-elevated)] animate-pulse mb-2" />
            <div className="h-4 w-24 rounded bg-[var(--bg-elevated)] animate-pulse" />
          </div>
        ))}
      </div>
    );
  }

  const stats = [
    {
      icon: Database,
      label: 'Total Stores',
      value: totalStores,
      color: 'text-[var(--amber)]',
      bgColor: 'bg-[var(--amber-glow)]',
    },
    {
      icon: FileText,
      label: 'Documents',
      value: totalDocuments,
      color: 'text-[var(--success)]',
      bgColor: 'bg-[rgba(34,197,94,0.15)]',
    },
    {
      icon: HardDrive,
      label: 'Storage Used',
      value: totalStorage,
      color: 'text-[var(--text-secondary)]',
      bgColor: 'bg-[var(--bg-elevated)]',
      isString: true,
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-12">
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <div
            key={index}
            className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-7 transition-all duration-200 hover:border-[var(--border-default)] hover:shadow-lg hover:-translate-y-0.5"
          >
            <div className="flex items-start gap-4 mb-5">
              <div className={`w-14 h-14 rounded-lg ${stat.bgColor} flex items-center justify-center shrink-0`}>
                <Icon size={24} className={stat.color} strokeWidth={1.5} />
              </div>
            </div>
            <div className="text-4xl font-bold text-[var(--text-primary)] mb-2 tracking-tight">
              {stat.isString ? stat.value : formatNumber(stat.value as number)}
            </div>
            <div className="text-xs text-[var(--text-muted)] uppercase tracking-widest font-semibold">
              {stat.label}
            </div>
          </div>
        );
      })}
    </div>
  );
}

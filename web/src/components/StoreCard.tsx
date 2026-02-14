'use client';

import { motion } from 'motion/react';
import { Database, ChevronRight } from 'lucide-react';

interface StoreCardProps {
  displayName: string;
  name: string;
  createTime?: string;
  index?: number;
  onClick?: () => void;
}

export default function StoreCard({ displayName, name, createTime, index = 0, onClick }: StoreCardProps) {
  const shortName = name.replace('fileSearchStores/', '');

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.06 }}
      onClick={onClick}
      className="group cursor-pointer rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5 transition-all duration-200 hover:border-[var(--amber-dim)] hover:shadow-[0_0_24px_var(--amber-glow)] hover:-translate-y-0.5"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="w-9 h-9 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-subtle)] flex items-center justify-center group-hover:border-[var(--amber-dim)] group-hover:bg-[var(--amber-glow)] transition-colors duration-200">
          <Database size={16} className="text-[var(--text-muted)] group-hover:text-[var(--amber)] transition-colors duration-200" />
        </div>
        <ChevronRight size={16} className="text-[var(--text-muted)] opacity-0 group-hover:opacity-100 group-hover:text-[var(--amber)] transition-all duration-200 translate-x-0 group-hover:translate-x-0.5" />
      </div>

      <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-1 truncate">
        {displayName}
      </h3>
      <p className="text-xs font-mono text-[var(--text-muted)] mb-3 truncate">
        {shortName}
      </p>

      {createTime && (
        <p className="text-[11px] text-[var(--text-muted)]">
          {new Date(createTime).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          })}
        </p>
      )}
    </motion.div>
  );
}

'use client';

import { motion } from 'motion/react';
import { Database, ChevronRight, FileText, Trash2 } from 'lucide-react';

interface StoreCardProps {
  displayName: string;
  name: string;
  createTime?: string;
  documentCount?: number;
  index?: number;
  onClick?: () => void;
  onDelete?: () => void;
}

export default function StoreCard({ displayName, name, createTime, documentCount, index = 0, onClick, onDelete }: StoreCardProps) {
  const shortName = name.replace('fileSearchStores/', '');

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.06 }}
      onClick={onClick}
      className="group cursor-pointer rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 transition-all duration-200 hover:border-[var(--amber-dim)] hover:shadow-[0_0_24px_var(--amber-glow)] hover:-translate-y-1"
    >
      <div className="flex items-start justify-between mb-5">
        <div className="w-12 h-12 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-subtle)] flex items-center justify-center group-hover:border-[var(--amber-dim)] group-hover:bg-[var(--amber-glow)] transition-colors duration-200">
          <Database size={20} className="text-[var(--text-muted)] group-hover:text-[var(--amber)] transition-colors duration-200" strokeWidth={1.5} />
        </div>
        <div className="flex items-center gap-1">
          {onDelete && (
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(); }}
              className="p-1.5 rounded-md text-[var(--text-muted)] opacity-0 group-hover:opacity-100 hover:text-red-400 hover:bg-red-400/10 transition-all duration-200 cursor-pointer"
            >
              <Trash2 size={14} />
            </button>
          )}
          <ChevronRight size={16} className="text-[var(--text-muted)] opacity-0 group-hover:opacity-100 group-hover:text-[var(--amber)] transition-all duration-200 translate-x-0 group-hover:translate-x-0.5" />
        </div>
      </div>

      <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-1 truncate" title={displayName}>
        {displayName}
      </h3>
      <p className="text-xs font-mono text-[var(--text-muted)] mb-4 truncate" title={shortName}>
        {shortName}
      </p>

      <div className="flex items-center justify-between pt-4 border-t border-[var(--border-subtle)]">
        {documentCount !== undefined && (
          <span className="inline-flex items-center gap-1 text-xs text-[var(--text-secondary)]">
            <FileText size={12} />
            {documentCount} {documentCount === 1 ? 'document' : 'documents'}
          </span>
        )}
        {createTime && (
          <p className="text-xs text-[var(--text-muted)]">
            {new Date(createTime).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}
          </p>
        )}
      </div>
    </motion.div>
  );
}

'use client';

import { motion } from 'motion/react';
import { FileText, Trash2 } from 'lucide-react';

interface DocumentRowProps {
  displayName: string;
  name: string;
  state?: string;
  createTime?: string;
  index?: number;
  onDelete?: () => void;
}

function statusColor(state?: string) {
  if (!state) return { bg: 'bg-[var(--text-muted)]', text: 'text-[var(--text-muted)]', label: 'UNKNOWN' };
  const s = state.toUpperCase();
  if (s === 'ACTIVE' || s === 'STATE_ACTIVE')
    return { bg: 'bg-[var(--success)]', text: 'text-[var(--success)]', label: 'ACTIVE' };
  if (s.includes('PENDING'))
    return { bg: 'bg-[var(--amber)]', text: 'text-[var(--amber)]', label: 'PENDING' };
  if (s.includes('FAIL'))
    return { bg: 'bg-[var(--danger)]', text: 'text-[var(--danger)]', label: 'FAILED' };
  return { bg: 'bg-[var(--text-muted)]', text: 'text-[var(--text-muted)]', label: s };
}

export default function DocumentRow({ displayName, name, state, createTime, index = 0, onDelete }: DocumentRowProps) {
  const shortName = name.replace('fileSearchStoreDocuments/', '').split('/').pop() ?? name;
  const status = statusColor(state);

  return (
    <motion.tr
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.25, delay: index * 0.04 }}
      className="group border-b border-[var(--border-subtle)] hover:bg-[var(--bg-elevated)] transition-colors duration-150"
    >
      <td className="py-3 px-4">
        <div className="flex items-center gap-3">
          <FileText size={15} className="text-[var(--text-muted)] shrink-0" />
          <div className="min-w-0">
            <p className="text-sm text-[var(--text-primary)] truncate">{displayName || shortName}</p>
            <p className="text-xs font-mono text-[var(--text-muted)] truncate">{shortName}</p>
          </div>
        </div>
      </td>
      <td className="py-3 px-4">
        <span className="inline-flex items-center gap-1.5">
          <span className={`w-1.5 h-1.5 rounded-full ${status.bg}`} />
          <span className={`text-xs font-mono font-medium ${status.text}`}>{status.label}</span>
        </span>
      </td>
      <td className="py-3 px-4 text-xs text-[var(--text-muted)]">
        {createTime
          ? new Date(createTime).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
          : '—'}
      </td>
      <td className="py-3 px-4 text-right">
        {onDelete && (
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            className="opacity-0 group-hover:opacity-100 p-1.5 rounded-md text-[var(--text-muted)] hover:text-[var(--danger)] hover:bg-[rgba(239,68,68,0.1)] transition-all duration-150 cursor-pointer"
          >
            <Trash2 size={14} />
          </button>
        )}
      </td>
    </motion.tr>
  );
}

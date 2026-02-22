'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { FileText, FileSpreadsheet, FileCode, FileImage, File, Trash2, ChevronDown } from 'lucide-react';
import { formatFileSize, formatRelativeTime } from '../lib/utils';

interface DocumentRowProps {
  displayName: string;
  name: string;
  state?: string;
  createTime?: string;
  sizeBytes?: string;
  mimeType?: string;
  customMetadata?: Array<{ key: string; stringValue: string }>;
  updateTime?: string;
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

function getMimeLabel(mimeType?: string): string {
  if (!mimeType) return '—';
  const map: Record<string, string> = {
    'application/pdf': 'PDF',
    'text/plain': 'TXT',
    'text/csv': 'CSV',
    'text/html': 'HTML',
    'text/markdown': 'MD',
    'application/json': 'JSON',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'DOCX',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'XLSX',
    'image/png': 'PNG',
    'image/jpeg': 'JPEG',
    'image/gif': 'GIF',
  };
  if (map[mimeType]) return map[mimeType];
  const sub = mimeType.split('/').pop() ?? mimeType;
  return sub.toUpperCase().slice(0, 6);
}

function getFileIcon(mimeType?: string) {
  if (!mimeType) return FileText;
  if (mimeType === 'application/pdf') return FileText;
  if (mimeType.startsWith('image/')) return FileImage;
  if (mimeType === 'text/csv' || mimeType.includes('spreadsheet')) return FileSpreadsheet;
  if (mimeType === 'application/json' || mimeType === 'text/html' || mimeType === 'text/markdown') return FileCode;
  if (mimeType.startsWith('text/')) return FileText;
  return File;
}

export default function DocumentRow({ displayName, name, state, createTime, sizeBytes, mimeType, customMetadata, updateTime, index = 0, onDelete }: DocumentRowProps) {
  const [expanded, setExpanded] = useState(false);
  const shortName = name.replace('fileSearchStoreDocuments/', '').split('/').pop() ?? name;
  const status = statusColor(state);
  const Icon = getFileIcon(mimeType);
  const colSpan = 6;

  return (
    <>
      <motion.tr
        initial={{ opacity: 0, x: -8 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.25, delay: index * 0.04 }}
        onClick={() => setExpanded(!expanded)}
        className="group border-b border-[var(--border-subtle)] hover:bg-[var(--bg-elevated)] transition-colors duration-150 cursor-pointer"
      >
        <td className="py-3 px-4">
          <div className="flex items-center gap-3">
            <Icon size={15} className="text-[var(--text-muted)] shrink-0" />
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
          {getMimeLabel(mimeType)}
        </td>
        <td className="py-3 px-4 text-xs text-[var(--text-muted)]">
          {sizeBytes ? formatFileSize(Number(sizeBytes)) : '—'}
        </td>
        <td className="py-3 px-4 text-xs text-[var(--text-muted)]">
          {createTime
            ? new Date(createTime).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
            : '—'}
        </td>
        <td className="py-3 px-4">
          <div className="flex items-center justify-end gap-1">
            <ChevronDown
              size={14}
              className={`text-[var(--text-muted)] transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
            />
            {onDelete && (
              <button
                onClick={(e) => { e.stopPropagation(); onDelete(); }}
                className="opacity-0 group-hover:opacity-100 p-1.5 rounded-md text-[var(--text-muted)] hover:text-[var(--danger)] hover:bg-[rgba(239,68,68,0.1)] transition-all duration-150 cursor-pointer"
              >
                <Trash2 size={14} />
              </button>
            )}
          </div>
        </td>
      </motion.tr>
      <AnimatePresence>
        {expanded && (
          <motion.tr
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
          >
            <td colSpan={colSpan} className="px-4 pb-4 pt-2 border-b border-[var(--border-subtle)] bg-[var(--bg-surface)]">
              <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-xs">
                <div>
                  <span className="text-[var(--text-muted)] uppercase tracking-wider">Resource Name</span>
                  <p className="font-mono text-[var(--text-secondary)] mt-0.5 break-all">{name}</p>
                </div>
                <div>
                  <span className="text-[var(--text-muted)] uppercase tracking-wider">MIME Type</span>
                  <p className="font-mono text-[var(--text-secondary)] mt-0.5">{mimeType ?? '—'}</p>
                </div>
                <div>
                  <span className="text-[var(--text-muted)] uppercase tracking-wider">Updated</span>
                  <p className="text-[var(--text-secondary)] mt-0.5">
                    {updateTime ? formatRelativeTime(new Date(updateTime)) : '—'}
                  </p>
                </div>
                <div>
                  <span className="text-[var(--text-muted)] uppercase tracking-wider">Size</span>
                  <p className="text-[var(--text-secondary)] mt-0.5">
                    {sizeBytes ? `${formatFileSize(Number(sizeBytes))} (${Number(sizeBytes).toLocaleString()} bytes)` : '—'}
                  </p>
                </div>
              </div>
              {customMetadata && customMetadata.length > 0 && (
                <div className="mt-3">
                  <span className="text-xs text-[var(--text-muted)] uppercase tracking-wider">Custom Metadata</span>
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    {customMetadata.map((entry) => (
                      <span
                        key={entry.key}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-mono bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-[var(--text-secondary)]"
                      >
                        <span className="text-[var(--text-muted)]">{entry.key}:</span>
                        {entry.stringValue}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </td>
          </motion.tr>
        )}
      </AnimatePresence>
    </>
  );
}

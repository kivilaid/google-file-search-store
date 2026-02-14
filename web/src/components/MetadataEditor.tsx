'use client';

import { useState, useCallback } from 'react';
import { Plus, X } from 'lucide-react';

interface MetadataRow {
  key: string;
  value: string;
  type: 'string' | 'number';
}

interface MetadataEditorProps {
  onChange: (metadata: Record<string, string | number>) => void;
}

export default function MetadataEditor({ onChange }: MetadataEditorProps) {
  const [rows, setRows] = useState<MetadataRow[]>([]);

  const emit = useCallback(
    (updated: MetadataRow[]) => {
      const result: Record<string, string | number> = {};
      for (const row of updated) {
        if (!row.key) continue;
        result[row.key] = row.type === 'number' ? Number(row.value) || 0 : row.value;
      }
      onChange(result);
    },
    [onChange],
  );

  const addRow = () => {
    const next = [...rows, { key: '', value: '', type: 'string' as const }];
    setRows(next);
  };

  const removeRow = (i: number) => {
    const next = rows.filter((_, idx) => idx !== i);
    setRows(next);
    emit(next);
  };

  const updateRow = (i: number, field: keyof MetadataRow, val: string) => {
    const next = rows.map((r, idx) => (idx === i ? { ...r, [field]: val } : r));
    setRows(next);
    emit(next);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">
          Metadata
        </label>
        <button
          type="button"
          onClick={addRow}
          className="inline-flex items-center gap-1 text-xs text-[var(--amber)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
        >
          <Plus size={12} /> Add field
        </button>
      </div>

      {rows.map((row, i) => (
        <div key={i} className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Key"
            value={row.key}
            onChange={(e) => updateRow(i, 'key', e.target.value)}
            className="flex-1 bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--amber)] focus:outline-none transition-colors"
          />
          <select
            value={row.type}
            onChange={(e) => updateRow(i, 'type', e.target.value)}
            className="bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-lg px-2 py-2 text-xs font-mono text-[var(--text-secondary)] focus:border-[var(--amber)] focus:outline-none cursor-pointer transition-colors"
          >
            <option value="string">str</option>
            <option value="number">num</option>
          </select>
          <input
            type={row.type === 'number' ? 'number' : 'text'}
            placeholder="Value"
            value={row.value}
            onChange={(e) => updateRow(i, 'value', e.target.value)}
            className="flex-1 bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--amber)] focus:outline-none transition-colors"
          />
          <button
            type="button"
            onClick={() => removeRow(i)}
            className="p-1.5 rounded-md text-[var(--text-muted)] hover:text-[var(--danger)] hover:bg-[rgba(239,68,68,0.1)] transition-colors cursor-pointer"
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}

'use client';

import { useRef, useState, useCallback } from 'react';
import { Upload, Loader2 } from 'lucide-react';

interface FileUploadZoneProps {
  onFileSelect: (file: File) => void;
  uploading?: boolean;
}

export default function FileUploadZone({ onFileSelect, uploading = false }: FileUploadZoneProps) {
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) onFileSelect(file);
    },
    [onFileSelect],
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) onFileSelect(file);
      if (inputRef.current) inputRef.current.value = '';
    },
    [onFileSelect],
  );

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
      onClick={() => !uploading && inputRef.current?.click()}
      className={`
        relative rounded-xl border-2 border-dashed p-8 text-center cursor-pointer transition-all duration-200
        ${
          uploading
            ? 'border-[var(--amber-dim)] bg-[var(--amber-glow)] cursor-wait'
            : dragOver
              ? 'border-[var(--amber)] bg-[var(--amber-glow)] shadow-[0_0_30px_var(--amber-glow)]'
              : 'border-[var(--border-default)] hover:border-[var(--amber-dim)] hover:bg-[var(--bg-elevated)]'
        }
      `}
    >
      <input ref={inputRef} type="file" className="hidden" onChange={handleChange} />

      <div className="flex flex-col items-center gap-3">
        {uploading ? (
          <Loader2 size={28} className="text-[var(--amber)] animate-spin" />
        ) : (
          <Upload
            size={28}
            className={`transition-colors duration-200 ${
              dragOver ? 'text-[var(--amber)]' : 'text-[var(--text-muted)]'
            }`}
          />
        )}
        <div>
          <p className="text-sm font-medium text-[var(--text-primary)]">
            {uploading ? 'Uploading...' : 'Drop a file here or click to browse'}
          </p>
          <p className="text-xs text-[var(--text-muted)] mt-1">
            PDF, TXT, HTML, CSV, and more
          </p>
        </div>
      </div>
    </div>
  );
}

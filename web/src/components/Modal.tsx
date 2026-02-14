'use client';

import { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
}

export default function Modal({ open, onClose, title, children, actions }: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
        >
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 8 }}
            transition={{ duration: 0.2 }}
            className="relative w-full max-w-md bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-xl shadow-2xl"
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border-subtle)]">
              <h2 className="text-sm font-semibold text-[var(--text-primary)]">{title}</h2>
              <button
                onClick={onClose}
                className="p-1.5 rounded-md text-[var(--text-muted)] hover:text-[var(--amber)] hover:bg-[var(--amber-glow)] transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="px-5 py-4">{children}</div>

            {actions && (
              <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-[var(--border-subtle)]">
                {actions}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

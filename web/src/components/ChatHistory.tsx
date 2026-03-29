'use client';

import { MessageCircle, Trash2, Clock } from 'lucide-react';
import { formatRelativeTime } from '../lib/utils';

export interface ChatSession {
  id: string;
  title: string;
  lastInteractionId: string | null;
  messages: { id: string; role: 'user' | 'assistant'; content: string }[];
  model: string;
  updatedAt: string;
}

interface ChatHistoryProps {
  sessions: ChatSession[];
  activeSessionId: string | null;
  onSelect: (session: ChatSession) => void;
  onDelete: (sessionId: string) => void;
}

export default function ChatHistory({ sessions, activeSessionId, onSelect, onDelete }: ChatHistoryProps) {
  if (sessions.length === 0) {
    return (
      <div className="text-center py-8">
        <Clock size={24} className="text-[var(--text-muted)] mx-auto mb-2" />
        <p className="text-xs text-[var(--text-muted)]">No conversations yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {sessions.map((session) => {
        const isActive = session.id === activeSessionId;
        return (
          <div
            key={session.id}
            className={`
              group flex items-center gap-2 rounded-lg px-3 py-2 cursor-pointer transition-all duration-150
              ${isActive
                ? 'bg-[var(--amber-glow)] text-[var(--amber)]'
                : 'text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)]'
              }
            `}
            onClick={() => onSelect(session)}
          >
            <MessageCircle size={14} className="shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm truncate">{session.title}</p>
              <p className={`text-[10px] ${isActive ? 'text-[var(--amber)]/60' : 'text-[var(--text-muted)]'}`}>
                {formatRelativeTime(new Date(session.updatedAt))}
              </p>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(session.id);
              }}
              className="opacity-0 group-hover:opacity-100 p-1 rounded text-[var(--text-muted)] hover:text-[var(--danger)] transition-all cursor-pointer"
              aria-label="Delete conversation"
            >
              <Trash2 size={12} />
            </button>
          </div>
        );
      })}
    </div>
  );
}

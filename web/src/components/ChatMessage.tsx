'use client';

import { Sparkles, User } from 'lucide-react';
import { motion } from 'motion/react';
import ReactMarkdown from 'react-markdown';

interface ChatMessageProps {
  role: 'user' | 'assistant';
  content: string;
  isStreaming?: boolean;
}

export default function ChatMessage({ role, content, isStreaming = false }: ChatMessageProps) {
  const isUser = role === 'user';

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''}`}
    >
      <div
        className={`
          w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-1
          ${isUser ? 'bg-[var(--bg-elevated)]' : 'bg-[var(--amber-glow)]'}
        `}
      >
        {isUser ? (
          <User size={14} className="text-[var(--text-secondary)]" />
        ) : (
          <Sparkles size={14} className="text-[var(--amber)]" />
        )}
      </div>

      <div
        className={`
          max-w-[80%] rounded-xl px-4 py-3 text-sm
          ${
            isUser
              ? 'bg-[var(--bg-elevated)] text-[var(--text-primary)]'
              : 'bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[var(--text-primary)]'
          }
        `}
      >
        {isUser ? (
          <p className="whitespace-pre-wrap">{content}</p>
        ) : (
          <div className="prose prose-invert prose-sm max-w-none prose-p:my-2 prose-headings:text-[var(--text-primary)] prose-strong:text-[var(--text-primary)] prose-a:text-[var(--amber)] prose-code:text-[var(--amber)] prose-code:bg-[var(--bg-elevated)] prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-li:my-0.5">
            <ReactMarkdown>{content || '\u200B'}</ReactMarkdown>
            {isStreaming && (
              <motion.span
                animate={{ opacity: [1, 0] }}
                transition={{ duration: 0.6, repeat: Infinity, repeatType: 'reverse' }}
                className="inline-block w-2 h-4 bg-[var(--amber)] rounded-sm ml-0.5 align-middle"
              />
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}

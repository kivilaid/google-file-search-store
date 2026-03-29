'use client';

import { useState } from 'react';
import { Sparkles, User, FileText, ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';

export interface Citation {
  title?: string;
  text?: string;
  file_search_store?: string;
}

interface ChatMessageProps {
  role: 'user' | 'assistant';
  content: string;
  citations?: Citation[];
  isStreaming?: boolean;
}

export default function ChatMessage({ role, content, citations, isStreaming = false }: ChatMessageProps) {
  const isUser = role === 'user';
  const [showCitations, setShowCitations] = useState(false);
  const hasCitations = citations && citations.length > 0;

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
          <>
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

            {hasCitations && (
              <div className="mt-3 pt-3 border-t border-[var(--border-subtle)]">
                <button
                  onClick={() => setShowCitations(!showCitations)}
                  className="flex items-center gap-1.5 text-xs text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors cursor-pointer"
                >
                  <FileText size={12} />
                  {citations.length} source{citations.length > 1 ? 's' : ''}
                  {showCitations ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                </button>
                <AnimatePresence>
                  {showCitations && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.15 }}
                      className="overflow-hidden"
                    >
                      <div className="mt-2 space-y-2">
                        {citations.map((c, i) => (
                          <div
                            key={i}
                            className="rounded-lg bg-[var(--bg-elevated)] px-3 py-2 text-xs"
                          >
                            {c.title && (
                              <p className="font-medium text-[var(--text-primary)] mb-1">{c.title}</p>
                            )}
                            {c.text && (
                              <p className="text-[var(--text-muted)] line-clamp-3">{c.text}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </>
        )}
      </div>
    </motion.div>
  );
}

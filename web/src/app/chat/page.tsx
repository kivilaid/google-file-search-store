'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { SquarePen, ChevronDown, PanelLeftClose, PanelLeft, Database, Globe, Code, Link } from 'lucide-react';
import ChatInput from '../../components/ChatInput';
import ChatMessage from '../../components/ChatMessage';
import type { Citation, ApiDebugInfo } from '../../components/ChatMessage';
import ChatHistory from '../../components/ChatHistory';
import type { ChatSession } from '../../components/ChatHistory';
import { useToast } from '../../components/Toast';
import { motion, AnimatePresence } from 'motion/react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  citations?: Citation[];
  debug?: ApiDebugInfo;
}

interface Store {
  name: string;
  displayName: string;
}

const MODELS = [
  { value: 'gemini-3-flash-preview', label: 'Gemini 3 Flash' },
  { value: 'gemini-3.1-pro-preview', label: 'Gemini 3.1 Pro' },
];

const STORAGE_KEY = 'chat-sessions';

function loadSessions(): ChatSession[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveSessions(sessions: ChatSession[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
  } catch { /* quota exceeded */ }
}

function generateTitle(messages: Message[]): string {
  const first = messages.find((m) => m.role === 'user');
  if (!first) return 'New Chat';
  const text = first.content.trim();
  return text.length > 50 ? text.slice(0, 50) + '...' : text;
}

export default function ChatPage() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [previousInteractionId, setPreviousInteractionId] = useState<string | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [model, setModel] = useState('gemini-3-flash-preview');
  const [showHistory, setShowHistory] = useState(true);
  const [stores, setStores] = useState<Store[]>([]);
  const [selectedStores, setSelectedStores] = useState<Set<string>>(new Set());
  const [showStoreSelector, setShowStoreSelector] = useState(false);
  const [enabledTools, setEnabledTools] = useState<Set<string>>(new Set());
  const abortRef = useRef<AbortController | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const toast = useToast();

  // Load sessions from localStorage on mount
  useEffect(() => {
    setSessions(loadSessions());
  }, []);

  // Fetch stores
  useEffect(() => {
    fetch('/api/stores')
      .then((r) => r.json())
      .then((data) => setStores(data.stores || []))
      .catch(() => {});
  }, []);

  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const toggleTool = (tool: string) => {
    setEnabledTools((prev) => {
      const next = new Set(prev);
      if (next.has(tool)) next.delete(tool);
      else next.add(tool);
      return next;
    });
  };

  const toggleStore = (name: string) => {
    setSelectedStores((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  // Persist current session to localStorage
  const persistSession = useCallback(
    (updatedMessages: Message[], interactionId: string | null) => {
      if (updatedMessages.length === 0) return;

      setSessions((prev) => {
        let updated: ChatSession[];
        const now = new Date().toISOString();

        if (activeSessionId) {
          updated = prev.map((s) =>
            s.id === activeSessionId
              ? { ...s, messages: updatedMessages, lastInteractionId: interactionId, title: generateTitle(updatedMessages), model, updatedAt: now }
              : s
          );
        } else {
          const newId = crypto.randomUUID();
          const newSession: ChatSession = {
            id: newId,
            title: generateTitle(updatedMessages),
            lastInteractionId: interactionId,
            messages: updatedMessages,
            model,
            updatedAt: now,
          };
          updated = [newSession, ...prev];
          setActiveSessionId(newId);
        }

        saveSessions(updated);
        return updated;
      });
    },
    [activeSessionId, model]
  );

  const handleSend = async (input: string) => {
    const userMsg: Message = { id: crypto.randomUUID(), role: 'user', content: input };
    const assistantMsg: Message = { id: crypto.randomUUID(), role: 'assistant', content: '' };

    const newMessages = [...messages, userMsg, assistantMsg];
    setMessages(newMessages);
    setIsStreaming(true);

    const controller = new AbortController();
    abortRef.current = controller;

    let finalInteractionId = previousInteractionId;
    let finalMessages = newMessages;
    let pendingCitations: Citation[] = [];
    let pendingDebug: ApiDebugInfo = {};

    try {
      const storeNames = Array.from(selectedStores);
      const builtinTools = Array.from(enabledTools);
      const systemInstruction = localStorage.getItem('chat-system-instruction') || undefined;
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          input, model, previousInteractionId, systemInstruction,
          storeNames: storeNames.length ? storeNames : undefined,
          builtinTools: builtinTools.length ? builtinTools : undefined,
        }),
        signal: controller.signal,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Request failed' }));
        throw new Error(err.error || `HTTP ${res.status}`);
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error('No response stream');

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split('\n\n');
        buffer = parts.pop() || '';

        for (const part of parts) {
          if (!part.startsWith('data: ')) continue;
          const data = JSON.parse(part.slice(6));

          if (data.type === 'request_params') {
            pendingDebug = { ...pendingDebug, requestParams: data.params };
            setMessages((prev) => {
              const updated = [...prev];
              const last = updated[updated.length - 1];
              if (last.role === 'assistant') {
                updated[updated.length - 1] = { ...last, debug: { ...pendingDebug } };
              }
              finalMessages = updated;
              return updated;
            });
          } else if (data.type === 'delta') {
            setMessages((prev) => {
              const updated = [...prev];
              const last = updated[updated.length - 1];
              if (last.role === 'assistant') {
                updated[updated.length - 1] = { ...last, content: last.content + data.text };
              }
              finalMessages = updated;
              return updated;
            });
          } else if (data.type === 'citations') {
            pendingCitations = [...pendingCitations, ...data.citations];
            setMessages((prev) => {
              const updated = [...prev];
              const last = updated[updated.length - 1];
              if (last.role === 'assistant') {
                updated[updated.length - 1] = { ...last, citations: pendingCitations };
              }
              finalMessages = updated;
              return updated;
            });
          } else if (data.type === 'complete') {
            finalInteractionId = data.interactionId;
            setPreviousInteractionId(data.interactionId);
            pendingDebug = { ...pendingDebug, responseInteraction: data.interaction };
            setMessages((prev) => {
              const updated = [...prev];
              const last = updated[updated.length - 1];
              if (last.role === 'assistant') {
                updated[updated.length - 1] = { ...last, debug: { ...pendingDebug } };
              }
              finalMessages = updated;
              return updated;
            });
          } else if (data.type === 'error') {
            throw new Error(data.message);
          }
        }
      }

      persistSession(finalMessages, finalInteractionId);
    } catch (err) {
      if ((err as Error).name === 'AbortError') return;
      toast.error((err as Error).message || 'Something went wrong');
      setMessages((prev) => {
        const updated = [...prev];
        const last = updated[updated.length - 1];
        if (last.role === 'assistant' && !last.content) {
          return updated.slice(0, -1);
        }
        return updated;
      });
    } finally {
      setIsStreaming(false);
      abortRef.current = null;
    }
  };

  const handleNewChat = () => {
    abortRef.current?.abort();
    setMessages([]);
    setPreviousInteractionId(null);
    setActiveSessionId(null);
    setIsStreaming(false);
  };

  const handleSelectSession = (session: ChatSession) => {
    abortRef.current?.abort();
    setIsStreaming(false);
    setActiveSessionId(session.id);
    setMessages(session.messages);
    setPreviousInteractionId(session.lastInteractionId);
    setModel(session.model);
  };

  const handleDeleteSession = (sessionId: string) => {
    setSessions((prev) => {
      const updated = prev.filter((s) => s.id !== sessionId);
      saveSessions(updated);
      return updated;
    });
    if (activeSessionId === sessionId) {
      handleNewChat();
    }
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] md:h-[calc(100vh-4rem)] -mb-4 gap-0">
      {/* History sidebar */}
      <AnimatePresence>
        {showHistory && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 260, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="shrink-0 overflow-hidden"
          >
            <div className="w-[260px] h-full flex flex-col border-r border-[var(--border-subtle)] pr-3">
              <div className="flex items-center justify-between py-2 mb-2">
                <h2 className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">
                  History
                </h2>
                <button
                  onClick={() => setShowHistory(false)}
                  className="p-1 rounded text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] transition-colors cursor-pointer"
                  aria-label="Close history"
                >
                  <PanelLeftClose size={16} />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto min-h-0">
                <ChatHistory
                  sessions={sessions}
                  activeSessionId={activeSessionId}
                  onSelect={handleSelectSession}
                  onDelete={handleDeleteSession}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main chat area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 shrink-0 px-2">
          <div className="flex items-center gap-3">
            {!showHistory && (
              <button
                onClick={() => setShowHistory(true)}
                className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] transition-colors cursor-pointer"
                aria-label="Show history"
              >
                <PanelLeft size={18} />
              </button>
            )}
            <h1 className="text-lg font-semibold text-[var(--text-primary)]">Chat</h1>
            <div className="relative">
              <select
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="appearance-none bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-lg px-3 py-1.5 pr-8 text-xs text-[var(--text-secondary)] focus:border-[var(--amber)] focus:outline-none transition-colors cursor-pointer"
              >
                {MODELS.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={12}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none"
              />
            </div>
            <button
              onClick={() => setShowStoreSelector(!showStoreSelector)}
              className={`
                flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs border transition-all duration-150 cursor-pointer
                ${selectedStores.size > 0
                  ? 'border-[var(--amber)] bg-[var(--amber-glow)] text-[var(--amber)]'
                  : 'border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:border-[var(--text-muted)]'
                }
              `}
            >
              <Database size={12} />
              {selectedStores.size > 0 ? `${selectedStores.size} store${selectedStores.size > 1 ? 's' : ''}` : 'Knowledge'}
            </button>
            {[
              { id: 'google_search', label: 'Search', icon: Globe },
              { id: 'code_execution', label: 'Code', icon: Code },
              { id: 'url_context', label: 'URL', icon: Link },
            ].map(({ id, label, icon: Icon }) => {
              const active = enabledTools.has(id);
              return (
                <button
                  key={id}
                  onClick={() => toggleTool(id)}
                  className={`
                    flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs border transition-all duration-150 cursor-pointer
                    ${active
                      ? 'border-[var(--amber)] bg-[var(--amber-glow)] text-[var(--amber)]'
                      : 'border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:border-[var(--text-muted)]'
                    }
                  `}
                >
                  <Icon size={12} />
                  {label}
                </button>
              );
            })}
          </div>
          <button
            onClick={handleNewChat}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] bg-[var(--bg-surface)] border border-[var(--border-subtle)] hover:border-[var(--text-muted)] transition-all duration-150 cursor-pointer"
          >
            <SquarePen size={14} />
            New Chat
          </button>
        </div>

        {/* Store selector dropdown */}
        <AnimatePresence>
          {showStoreSelector && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="overflow-hidden px-2 shrink-0"
            >
              <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-3 mb-3">
                <p className="text-xs text-[var(--text-muted)] mb-2">
                  Select stores to use as knowledge source:
                </p>
                {stores.length === 0 ? (
                  <p className="text-xs text-[var(--text-muted)]">No stores available.</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {stores.map((store) => {
                      const selected = selectedStores.has(store.name);
                      return (
                        <button
                          key={store.name}
                          onClick={() => toggleStore(store.name)}
                          className={`
                            px-2.5 py-1 rounded-lg text-xs border transition-all duration-150 cursor-pointer
                            ${selected
                              ? 'border-[var(--amber)] bg-[var(--amber-glow)] text-[var(--amber)] shadow-[0_0_12px_var(--amber-glow)]'
                              : 'border-[var(--border-subtle)] bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:border-[var(--border-default)]'
                            }
                          `}
                        >
                          {store.displayName}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto min-h-0">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
              >
                <div className="w-12 h-12 rounded-xl bg-[var(--amber-glow)] flex items-center justify-center mb-4 mx-auto">
                  <span className="text-[var(--amber)] text-xl">G</span>
                </div>
                <h2 className="text-base font-medium text-[var(--text-primary)] mb-1">
                  How can I help you?
                </h2>
                <p className="text-sm text-[var(--text-muted)] max-w-sm">
                  Start a conversation with Gemini.
                  {stores.length > 0 && ' Select stores above to ground responses in your documents.'}
                </p>
              </motion.div>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto space-y-4 pb-4 px-2">
              <AnimatePresence mode="popLayout">
                {messages.map((msg) => (
                  <ChatMessage
                    key={msg.id}
                    role={msg.role}
                    content={msg.content}
                    citations={msg.citations}
                    debug={msg.debug}
                    isStreaming={isStreaming && msg.id === messages[messages.length - 1]?.id && msg.role === 'assistant'}
                  />
                ))}
              </AnimatePresence>
              <div ref={bottomRef} />
            </div>
          )}
        </div>

        {/* Input */}
        <div className="pt-4 shrink-0 px-2">
          <ChatInput onSend={handleSend} disabled={isStreaming} />
          <p className="text-[10px] text-[var(--text-muted)] text-center mt-2">
            Gemini can make mistakes. Verify important information.
          </p>
        </div>
      </div>
    </div>
  );
}

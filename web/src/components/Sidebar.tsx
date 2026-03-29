'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Database, Search, Settings, Menu, X, MessageCircle } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';

const navItems = [
  { href: '/chat', label: 'Chat', icon: MessageCircle },
  { href: '/stores', label: 'Stores', icon: Database },
  { href: '/query', label: 'Query', icon: Search },
  { href: '/settings', label: 'Settings', icon: Settings },
];

function SidebarContent() {
  const pathname = usePathname();

  return (
    <>
      <div className="px-5 py-6 border-b border-[var(--border-subtle)]">
        <Link href="/stores" className="flex items-center gap-2.5 no-underline">
          <div className="w-8 h-8 rounded-md bg-[var(--amber-glow)] flex items-center justify-center">
            <Database size={16} className="text-[var(--amber)]" />
          </div>
          <div>
            <h1 className="text-sm font-semibold text-[var(--text-primary)] leading-tight tracking-tight">
              File Search
            </h1>
            <p className="text-[10px] font-mono text-[var(--text-muted)] uppercase tracking-[0.1em]">
              Store
            </p>
          </div>
        </Link>
      </div>

      <nav className="flex-1 py-4 px-3 flex flex-col gap-1">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href || pathname.startsWith(href + '/');
          return (
            <Link
              key={href}
              href={href}
              className={`
                flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 no-underline
                ${
                  isActive
                    ? 'text-[var(--amber)] bg-[var(--amber-glow)] border-l-2 border-[var(--amber)] shadow-[inset_0_0_20px_var(--amber-glow)]'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] border-l-2 border-transparent'
                }
              `}
            >
              <Icon size={18} strokeWidth={isActive ? 2 : 1.5} />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="px-5 py-4 border-t border-[var(--border-subtle)]">
        <p className="text-[10px] font-mono text-[var(--text-muted)] uppercase tracking-wider">
          Gemini API
        </p>
      </div>
    </>
  );
}

export default function Sidebar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  // Close sidebar on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Close on Escape
  useEffect(() => {
    if (!mobileOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileOpen(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [mobileOpen]);

  return (
    <>
      {/* Mobile header bar */}
      <div className="fixed top-0 left-0 right-0 h-12 bg-[var(--bg-surface)] border-b border-[var(--border-subtle)] flex items-center px-4 z-40 md:hidden">
        <button
          onClick={() => setMobileOpen(true)}
          className="p-1.5 rounded-md text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] transition-colors cursor-pointer"
          aria-label="Open navigation menu"
        >
          <Menu size={20} />
        </button>
        <div className="flex items-center gap-2 ml-3">
          <div className="w-6 h-6 rounded-md bg-[var(--amber-glow)] flex items-center justify-center">
            <Database size={12} className="text-[var(--amber)]" />
          </div>
          <span className="text-sm font-semibold text-[var(--text-primary)]">File Search Store</span>
        </div>
      </div>

      {/* Desktop sidebar */}
      <aside className="hidden md:flex fixed left-0 top-0 h-screen w-[240px] bg-[var(--bg-surface)] border-r border-[var(--border-subtle)] flex-col z-50">
        <SidebarContent />
      </aside>

      {/* Mobile sidebar overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 md:hidden"
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              initial={{ x: -240 }}
              animate={{ x: 0 }}
              exit={{ x: -240 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="fixed left-0 top-0 h-screen w-[240px] bg-[var(--bg-surface)] border-r border-[var(--border-subtle)] flex flex-col z-50 md:hidden"
            >
              <div className="absolute top-4 right-3">
                <button
                  onClick={() => setMobileOpen(false)}
                  className="p-1.5 rounded-md text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] transition-colors cursor-pointer"
                  aria-label="Close navigation menu"
                >
                  <X size={18} />
                </button>
              </div>
              <SidebarContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

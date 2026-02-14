'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Database, Search, Settings } from 'lucide-react';

const navItems = [
  { href: '/stores', label: 'Stores', icon: Database },
  { href: '/query', label: 'Query', icon: Search },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 h-screen w-[240px] bg-[var(--bg-surface)] border-r border-[var(--border-subtle)] flex flex-col z-50">
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
    </aside>
  );
}

'use client';

import { Search } from 'lucide-react';

type StoreSortOption = 'all' | 'recent' | 'most_documents';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  sortBy: StoreSortOption;
  onSortChange: (sort: StoreSortOption) => void;
}

export default function SearchBar({ value, onChange, sortBy, onSortChange }: SearchBarProps) {
  return (
    <div className="flex gap-3 mb-10">
      <div className="relative flex-1">
        <Search
          size={16}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] pointer-events-none"
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="🔍 Search stores..."
          className="w-full bg-[var(--bg-elevated)] border border-[var(--border-default)] rounded-lg pl-11 pr-4 py-3 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:border-[var(--amber)] focus:outline-none focus:shadow-[0_0_0_3px_var(--amber-glow)] transition-all"
        />
      </div>
      <select
        value={sortBy}
        onChange={(e) => onSortChange(e.target.value as StoreSortOption)}
        className="bg-[var(--bg-elevated)] border border-[var(--border-default)] rounded-lg px-4 py-3 text-sm text-[var(--text-primary)] focus:border-[var(--amber)] focus:outline-none cursor-pointer transition-colors min-w-[160px]"
      >
        <option value="all">All Stores</option>
        <option value="recent">Recent</option>
        <option value="most_documents">Most Documents</option>
      </select>
    </div>
  );
}

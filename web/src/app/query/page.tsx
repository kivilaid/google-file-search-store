'use client';

import { useEffect, useState, useCallback } from 'react';
import QueryInput from '../../components/QueryInput';
import CitationCard from '../../components/CitationCard';
import LoadingSkeleton from '../../components/LoadingSkeleton';

interface Store {
  name: string;
  displayName: string;
}

interface Citation {
  title?: string;
  uri?: string;
  snippet?: string;
  startIndex?: number;
  endIndex?: number;
}

interface QueryResult {
  text: string;
  citations: Citation[];
}

const MODELS = [
  { value: 'gemini-3-flash-preview', label: 'Gemini 3 Flash' },
  { value: 'gemini-3-pro-preview', label: 'Gemini 3 Pro' },
];

export default function QueryPage() {
  const [stores, setStores] = useState<Store[]>([]);
  const [selectedStores, setSelectedStores] = useState<Set<string>>(new Set());
  const [model, setModel] = useState(MODELS[0].value);
  const [metadataFilter, setMetadataFilter] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<QueryResult | null>(null);
  const [storesLoading, setStoresLoading] = useState(true);

  useEffect(() => {
    fetch('/api/stores')
      .then((r) => r.json())
      .then((data) => setStores(data.stores ?? []))
      .catch(() => {})
      .finally(() => setStoresLoading(false));
  }, []);

  const toggleStore = useCallback((name: string) => {
    setSelectedStores((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  }, []);

  const handleQuery = async (query: string) => {
    if (selectedStores.size === 0) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch('/api/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storeNames: Array.from(selectedStores),
          query,
          model,
          metadataFilter: metadataFilter.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setResult({ text: data.text ?? '', citations: data.citations ?? [] });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl">
      <div className="mb-8">
        <h1 className="text-xl font-semibold text-[var(--text-primary)]">Query</h1>
        <p className="text-sm text-[var(--text-muted)] mt-1">
          Search across your document stores with AI
        </p>
      </div>

      {/* Store selection */}
      <div className="mb-6">
        <label className="block text-xs font-medium text-[var(--text-secondary)] mb-2.5 uppercase tracking-wider">
          Select Stores
        </label>
        {storesLoading ? (
          <LoadingSkeleton variant="row" count={2} />
        ) : stores.length === 0 ? (
          <p className="text-sm text-[var(--text-muted)]">No stores available. Create one first.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {stores.map((store) => {
              const selected = selectedStores.has(store.name);
              return (
                <button
                  key={store.name}
                  onClick={() => toggleStore(store.name)}
                  className={`
                    px-3 py-1.5 rounded-lg text-sm border transition-all duration-150 cursor-pointer
                    ${
                      selected
                        ? 'border-[var(--amber)] bg-[var(--amber-glow)] text-[var(--amber)] shadow-[0_0_12px_var(--amber-glow)]'
                        : 'border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:border-[var(--border-default)]'
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

      {/* Model + filter row */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5 uppercase tracking-wider">
            Model
          </label>
          <select
            value={model}
            onChange={(e) => setModel(e.target.value)}
            className="w-full bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-lg px-3 py-2.5 text-sm text-[var(--text-primary)] focus:border-[var(--amber)] focus:outline-none cursor-pointer transition-colors"
          >
            {MODELS.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5 uppercase tracking-wider">
            Metadata Filter
          </label>
          <input
            type="text"
            value={metadataFilter}
            onChange={(e) => setMetadataFilter(e.target.value)}
            placeholder='e.g. key = "value"'
            className="w-full bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-lg px-3 py-2.5 text-sm font-mono text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--amber)] focus:outline-none transition-colors"
          />
        </div>
      </div>

      {/* Query input */}
      <div className="mb-8">
        <QueryInput onSubmit={handleQuery} loading={loading} />
        {selectedStores.size === 0 && (
          <p className="text-xs text-[var(--text-muted)] mt-2">Select at least one store to query.</p>
        )}
      </div>

      {/* Results */}
      {loading && (
        <div className="space-y-3">
          <LoadingSkeleton variant="text" count={1} />
          <LoadingSkeleton variant="card" count={2} />
        </div>
      )}

      {result && (
        <div className="space-y-6">
          <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5">
            <h3 className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider mb-3">
              Answer
            </h3>
            <div className="text-sm text-[var(--text-primary)] leading-relaxed whitespace-pre-wrap">
              {result.text}
            </div>
          </div>

          {result.citations.length > 0 && (
            <div>
              <h3 className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider mb-3">
                Citations ({result.citations.length})
              </h3>
              <div className="space-y-2">
                {result.citations.map((c, i) => (
                  <CitationCard
                    key={i}
                    index={i + 1}
                    title={c.title}
                    uri={c.uri}
                    snippet={c.snippet}
                    startIndex={c.startIndex}
                    endIndex={c.endIndex}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

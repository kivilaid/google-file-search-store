'use client';

import { useEffect, useState, useCallback } from 'react';
import { ChevronDown } from 'lucide-react';
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

const RESPONSE_FORMATS = [
  { value: '', label: 'Default (text)' },
  { value: 'text/plain', label: 'Plain Text' },
  { value: 'application/json', label: 'JSON' },
];

function ParamLabel({ label, description }: { label: string; description: string }) {
  return (
    <label className="block mb-1.5">
      <span className="text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">
        {label}
      </span>
      <span className="block text-[11px] text-[var(--text-muted)] mt-0.5 leading-snug normal-case tracking-normal">
        {description}
      </span>
    </label>
  );
}

const inputClass =
  'w-full bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-lg px-3 py-2.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--amber)] focus:outline-none transition-colors';
const monoInputClass = `${inputClass} font-mono`;

export default function QueryPage() {
  const [stores, setStores] = useState<Store[]>([]);
  const [selectedStores, setSelectedStores] = useState<Set<string>>(new Set());
  const [model, setModel] = useState(MODELS[0].value);
  const [metadataFilter, setMetadataFilter] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<QueryResult | null>(null);
  const [storesLoading, setStoresLoading] = useState(true);
  const [advancedOpen, setAdvancedOpen] = useState(false);

  // Advanced parameters
  const [systemInstruction, setSystemInstruction] = useState('');
  const [retrievalTopK, setRetrievalTopK] = useState('');
  const [temperature, setTemperature] = useState('');
  const [topP, setTopP] = useState('');
  const [topK, setTopK] = useState('');
  const [maxOutputTokens, setMaxOutputTokens] = useState('');
  const [stopSequences, setStopSequences] = useState('');
  const [presencePenalty, setPresencePenalty] = useState('');
  const [frequencyPenalty, setFrequencyPenalty] = useState('');
  const [seed, setSeed] = useState('');
  const [responseMimeType, setResponseMimeType] = useState('');

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
      const payload: Record<string, unknown> = {
        storeNames: Array.from(selectedStores),
        query,
        model,
      };
      if (metadataFilter.trim()) payload.metadataFilter = metadataFilter.trim();
      if (systemInstruction.trim()) payload.systemInstruction = systemInstruction.trim();
      if (retrievalTopK) payload.retrievalTopK = parseInt(retrievalTopK, 10);
      if (temperature) payload.temperature = parseFloat(temperature);
      if (topP) payload.topP = parseFloat(topP);
      if (topK) payload.topK = parseInt(topK, 10);
      if (maxOutputTokens) payload.maxOutputTokens = parseInt(maxOutputTokens, 10);
      if (stopSequences.trim()) {
        payload.stopSequences = stopSequences.split(',').map((s) => s.trim()).filter(Boolean);
      }
      if (presencePenalty) payload.presencePenalty = parseFloat(presencePenalty);
      if (frequencyPenalty) payload.frequencyPenalty = parseFloat(frequencyPenalty);
      if (seed) payload.seed = parseInt(seed, 10);
      if (responseMimeType) payload.responseMimeType = responseMimeType;

      const res = await fetch('/api/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
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
        <ParamLabel
          label="Select Stores"
          description="Choose one or more stores to search. The model will retrieve relevant chunks from all selected stores."
        />
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
          <ParamLabel
            label="Model"
            description="The Gemini model to use for generating the answer from retrieved documents."
          />
          <select
            value={model}
            onChange={(e) => setModel(e.target.value)}
            className={`${inputClass} cursor-pointer`}
          >
            {MODELS.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <ParamLabel
            label="Metadata Filter"
            description="Filter retrieved documents by metadata using AIP-160 syntax. E.g. category = &quot;finance&quot; AND year > 2023"
          />
          <input
            type="text"
            value={metadataFilter}
            onChange={(e) => setMetadataFilter(e.target.value)}
            placeholder='e.g. key = "value"'
            className={monoInputClass}
          />
        </div>
      </div>

      {/* Advanced options */}
      <div className="mb-6">
        <button
          onClick={() => setAdvancedOpen(!advancedOpen)}
          className="flex items-center gap-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer mb-4"
        >
          <ChevronDown
            size={16}
            className={`transition-transform duration-200 ${advancedOpen ? 'rotate-0' : '-rotate-90'}`}
          />
          Advanced Options
        </button>

        {advancedOpen && (
          <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5 space-y-5">
            {/* System Instruction */}
            <div>
              <ParamLabel
                label="System Instruction"
                description="Initial instructions that guide the model's behavior and response style. Acts as a persistent system-level prompt."
              />
              <textarea
                value={systemInstruction}
                onChange={(e) => setSystemInstruction(e.target.value)}
                placeholder="e.g. You are a helpful research assistant. Always cite your sources."
                rows={2}
                className={`${inputClass} resize-none`}
              />
            </div>

            {/* Retrieval config */}
            <div>
              <h4 className="text-xs font-semibold text-[var(--text-primary)] uppercase tracking-wider mb-3 pb-2 border-b border-[var(--border-subtle)]">
                Retrieval
              </h4>
              <div>
                <ParamLabel
                  label="Retrieval Top K"
                  description="Number of document chunks to retrieve from the store before generating the answer. Higher values provide more context but increase latency."
                />
                <input
                  type="number"
                  value={retrievalTopK}
                  onChange={(e) => setRetrievalTopK(e.target.value)}
                  placeholder="Default (auto)"
                  min={1}
                  max={100}
                  className={inputClass}
                />
              </div>
            </div>

            {/* Generation config */}
            <div>
              <h4 className="text-xs font-semibold text-[var(--text-primary)] uppercase tracking-wider mb-3 pb-2 border-b border-[var(--border-subtle)]">
                Generation
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <ParamLabel
                    label="Temperature"
                    description="Controls randomness. 0 = deterministic, 1 = creative. Lower values produce more focused and factual responses."
                  />
                  <input
                    type="number"
                    value={temperature}
                    onChange={(e) => setTemperature(e.target.value)}
                    placeholder="Default (model-specific)"
                    min={0}
                    max={2}
                    step={0.05}
                    className={inputClass}
                  />
                </div>
                <div>
                  <ParamLabel
                    label="Top P"
                    description="Nucleus sampling threshold. The model considers tokens whose cumulative probability reaches this value. Lower = more focused."
                  />
                  <input
                    type="number"
                    value={topP}
                    onChange={(e) => setTopP(e.target.value)}
                    placeholder="Default (model-specific)"
                    min={0}
                    max={1}
                    step={0.05}
                    className={inputClass}
                  />
                </div>
                <div>
                  <ParamLabel
                    label="Top K"
                    description="Limits token selection to the K most likely next tokens at each step. Lower values make output more deterministic."
                  />
                  <input
                    type="number"
                    value={topK}
                    onChange={(e) => setTopK(e.target.value)}
                    placeholder="Default (model-specific)"
                    min={1}
                    className={inputClass}
                  />
                </div>
                <div>
                  <ParamLabel
                    label="Max Output Tokens"
                    description="Maximum number of tokens in the generated response. One token is roughly 4 characters."
                  />
                  <input
                    type="number"
                    value={maxOutputTokens}
                    onChange={(e) => setMaxOutputTokens(e.target.value)}
                    placeholder="Default (model max)"
                    min={1}
                    className={inputClass}
                  />
                </div>
                <div>
                  <ParamLabel
                    label="Presence Penalty"
                    description="Penalizes tokens that have already appeared, encouraging the model to talk about new topics. Range: -2.0 to 2.0."
                  />
                  <input
                    type="number"
                    value={presencePenalty}
                    onChange={(e) => setPresencePenalty(e.target.value)}
                    placeholder="0"
                    min={-2}
                    max={2}
                    step={0.1}
                    className={inputClass}
                  />
                </div>
                <div>
                  <ParamLabel
                    label="Frequency Penalty"
                    description="Penalizes tokens based on how often they've appeared, reducing repetition. Range: -2.0 to 2.0."
                  />
                  <input
                    type="number"
                    value={frequencyPenalty}
                    onChange={(e) => setFrequencyPenalty(e.target.value)}
                    placeholder="0"
                    min={-2}
                    max={2}
                    step={0.1}
                    className={inputClass}
                  />
                </div>
              </div>
            </div>

            {/* Output config */}
            <div>
              <h4 className="text-xs font-semibold text-[var(--text-primary)] uppercase tracking-wider mb-3 pb-2 border-b border-[var(--border-subtle)]">
                Output
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <ParamLabel
                    label="Response Format"
                    description="The output format. Use JSON to get structured responses (pair with a system instruction describing the schema)."
                  />
                  <select
                    value={responseMimeType}
                    onChange={(e) => setResponseMimeType(e.target.value)}
                    className={`${inputClass} cursor-pointer`}
                  >
                    {RESPONSE_FORMATS.map((f) => (
                      <option key={f.value} value={f.value}>
                        {f.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <ParamLabel
                    label="Stop Sequences"
                    description="Comma-separated strings that will stop generation when encountered. E.g. \n, END, ---"
                  />
                  <input
                    type="text"
                    value={stopSequences}
                    onChange={(e) => setStopSequences(e.target.value)}
                    placeholder="e.g. END, ---"
                    className={monoInputClass}
                  />
                </div>
              </div>
            </div>

            {/* Reproducibility */}
            <div>
              <h4 className="text-xs font-semibold text-[var(--text-primary)] uppercase tracking-wider mb-3 pb-2 border-b border-[var(--border-subtle)]">
                Reproducibility
              </h4>
              <div className="max-w-[calc(50%-0.5rem)]">
                <ParamLabel
                  label="Seed"
                  description="Fixed integer seed for reproducible outputs. Same seed + same input = same output (best effort, not guaranteed)."
                />
                <input
                  type="number"
                  value={seed}
                  onChange={(e) => setSeed(e.target.value)}
                  placeholder="Random"
                  className={inputClass}
                />
              </div>
            </div>
          </div>
        )}
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

import { GoogleGenAI } from '@google/genai';
import { lookup } from 'mime-types';

// Types
export interface CreateStoreOptions {
  displayName: string;
}

export interface UploadDocumentOptions {
  storeNameOrId: string;
  filePath: string;
  displayName?: string;
  chunkingConfig?: { maxTokensPerChunk?: number; maxOverlapTokens?: number };
  metadata?: { key: string; stringValue?: string; numericValue?: number }[];
  mimeType?: string;
}

export interface QueryOptions {
  storeNames: string[];
  query: string;
  model?: string;
  metadataFilter?: string;
  // File search
  retrievalTopK?: number;
  // Generation config
  systemInstruction?: string;
  temperature?: number;
  topP?: number;
  topK?: number;
  maxOutputTokens?: number;
  stopSequences?: string[];
  presencePenalty?: number;
  frequencyPenalty?: number;
  seed?: number;
  responseMimeType?: string;
}

export interface Citation {
  startIndex?: number;
  endIndex?: number;
  uri?: string;
  title?: string;
  snippet?: string;
}

export interface QueryResult {
  text: string;
  citations: Citation[];
}

// Client
const DEFAULT_MODEL = 'gemini-3-flash-preview';

let _ai: GoogleGenAI | null = null;

function getAI(): GoogleGenAI {
  if (_ai) return _ai;
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY environment variable is required');
  _ai = new GoogleGenAI({ apiKey });
  return _ai;
}

// Simple in-memory cache
interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const cache = new Map<string, CacheEntry<unknown>>();
const CACHE_TTL = 30_000; // 30 seconds

function getCached<T>(key: string): T | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > CACHE_TTL) {
    cache.delete(key);
    return null;
  }
  return entry.data as T;
}

function setCache<T>(key: string, data: T): void {
  cache.set(key, { data, timestamp: Date.now() });
}

export function invalidateCache(prefix?: string) {
  if (!prefix) {
    cache.clear();
    return;
  }
  for (const key of cache.keys()) {
    if (key.startsWith(prefix)) cache.delete(key);
  }
}

async function pollOperation(ai: GoogleGenAI, operation: any): Promise<any> {
  let current = operation;
  const timeout = 5 * 60 * 1000;
  const start = Date.now();
  while (!current.done) {
    if (Date.now() - start > timeout) throw new Error('Operation timed out');
    await new Promise((r) => setTimeout(r, 2000));
    current = await ai.operations.get({ operation: current });
  }
  return current;
}

export async function createStore(displayName: string) {
  const ai = getAI();
  return ai.fileSearchStores.create({ config: { displayName } });
}

export async function listStores({ includeDocumentCounts = false } = {}) {
  const cacheKey = `stores:list:${includeDocumentCounts}`;
  const cached = getCached<any[]>(cacheKey);
  if (cached) return cached;

  const ai = getAI();
  const stores = [];
  const pager = await ai.fileSearchStores.list({});
  for await (const store of pager) {
    stores.push(store);
  }

  if (includeDocumentCounts) {
    const counts = await Promise.all(
      stores.map(async (store) => {
        try {
          const docs = await listDocuments(store.name!);
          return docs.length;
        } catch {
          return 0;
        }
      }),
    );
    for (let i = 0; i < stores.length; i++) {
      (stores[i] as any).documentCount = counts[i];
    }
  }

  setCache(cacheKey, stores);
  return stores;
}

export async function getStore(name: string) {
  const ai = getAI();
  return ai.fileSearchStores.get({ name });
}

export async function deleteStore(name: string, force?: boolean) {
  const ai = getAI();
  return ai.fileSearchStores.delete({ name, config: { force } });
}

export async function uploadDocument(options: UploadDocumentOptions) {
  const ai = getAI();
  const mimeType = options.mimeType || lookup(options.filePath) || 'application/octet-stream';
  const chunkingConfig = options.chunkingConfig
    ? {
        whiteSpaceConfig: {
          maxTokensPerChunk: options.chunkingConfig.maxTokensPerChunk,
          maxOverlapTokens: options.chunkingConfig.maxOverlapTokens,
        },
      }
    : undefined;
  const inlineMetadata = options.metadata?.map((m) => ({
    key: m.key,
    stringValue: m.stringValue,
    numericValue: m.numericValue,
  }));

  const operation = await ai.fileSearchStores.uploadToFileSearchStore({
    file: options.filePath,
    fileSearchStoreName: options.storeNameOrId,
    config: {
      displayName: options.displayName,
      chunkingConfig,
      customMetadata: inlineMetadata,
      mimeType,
    },
  });
  return pollOperation(ai, operation);
}

export async function listDocuments(storeNameOrId: string) {
  const cacheKey = `docs:${storeNameOrId}`;
  const cached = getCached<any[]>(cacheKey);
  if (cached) return cached;

  const ai = getAI();
  const docs = [];
  const pager = await ai.fileSearchStores.documents.list({ parent: storeNameOrId });
  for await (const doc of pager) {
    docs.push(doc);
  }
  setCache(cacheKey, docs);
  return docs;
}

export async function deleteDocument(name: string) {
  const ai = getAI();
  return ai.fileSearchStores.documents.delete({ name });
}

export async function queryStore(options: QueryOptions): Promise<QueryResult> {
  const ai = getAI();
  const model = options.model ?? DEFAULT_MODEL;

  const fileSearchConfig: Record<string, unknown> = {
    fileSearchStoreNames: options.storeNames,
  };
  if (options.metadataFilter) fileSearchConfig.metadataFilter = options.metadataFilter;
  if (options.retrievalTopK != null) fileSearchConfig.topK = options.retrievalTopK;

  const config: Record<string, unknown> = {
    tools: [{ fileSearch: fileSearchConfig }],
  };
  if (options.systemInstruction) config.systemInstruction = options.systemInstruction;
  if (options.temperature != null) config.temperature = options.temperature;
  if (options.topP != null) config.topP = options.topP;
  if (options.topK != null) config.topK = options.topK;
  if (options.maxOutputTokens != null) config.maxOutputTokens = options.maxOutputTokens;
  if (options.stopSequences?.length) config.stopSequences = options.stopSequences;
  if (options.presencePenalty != null) config.presencePenalty = options.presencePenalty;
  if (options.frequencyPenalty != null) config.frequencyPenalty = options.frequencyPenalty;
  if (options.seed != null) config.seed = options.seed;
  if (options.responseMimeType) config.responseMimeType = options.responseMimeType;

  const response = await ai.models.generateContent({
    model,
    contents: options.query,
    config,
  });

  const text = response.text ?? '';
  const citations: Citation[] = [];

  const groundingMetadata = response.candidates?.[0]?.groundingMetadata;
  if (groundingMetadata?.groundingChunks) {
    for (const chunk of groundingMetadata.groundingChunks) {
      citations.push({
        uri: chunk.retrievedContext?.uri,
        title: chunk.retrievedContext?.title,
        snippet: chunk.retrievedContext?.text,
      });
    }
  }

  return { text, citations };
}

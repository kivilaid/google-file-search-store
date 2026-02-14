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

function getAI(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY environment variable is required');
  return new GoogleGenAI({ apiKey });
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

export async function listStores() {
  const ai = getAI();
  return ai.fileSearchStores.list({});
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
  const ai = getAI();
  return ai.fileSearchStores.documents.list({ parent: storeNameOrId });
}

export async function deleteDocument(name: string) {
  const ai = getAI();
  return ai.fileSearchStores.documents.delete({ name });
}

export async function queryStore(options: QueryOptions): Promise<QueryResult> {
  const ai = getAI();
  const model = options.model ?? DEFAULT_MODEL;

  const response = await ai.models.generateContent({
    model,
    contents: options.query,
    config: {
      tools: [
        {
          fileSearch: {
            fileSearchStoreNames: options.storeNames,
            ...(options.metadataFilter ? { metadataFilter: options.metadataFilter } : {}),
          },
        },
      ],
    },
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

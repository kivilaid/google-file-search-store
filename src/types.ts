import type { GenerateContentResponse } from '@google/genai';

export interface FileSearchStoreClientConfig {
  apiKey?: string;
  model?: string;
}

export interface CreateStoreOptions {
  displayName: string;
}

export interface ListStoresOptions {
  pageSize?: number;
  pageToken?: string;
}

export interface DeleteStoreOptions {
  force?: boolean;
}

export interface ChunkingConfig {
  maxTokensPerChunk?: number;
  maxOverlapTokens?: number;
}

export interface DocumentMetadata {
  key: string;
  stringValue?: string;
  numericValue?: number;
}

export interface UploadDocumentOptions {
  storeNameOrId: string;
  filePath: string;
  displayName?: string;
  chunkingConfig?: ChunkingConfig;
  metadata?: DocumentMetadata[];
}

export interface ImportDocumentOptions {
  storeNameOrId: string;
  filesApiName: string;
  displayName?: string;
  chunkingConfig?: ChunkingConfig;
  metadata?: DocumentMetadata[];
}

export interface ListDocumentsOptions {
  storeNameOrId: string;
  pageSize?: number;
  pageToken?: string;
}

export interface QueryOptions {
  storeNames: string[];
  query: string;
  model?: string;
  metadataFilter?: string;
  systemInstruction?: string;
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
  rawResponse: GenerateContentResponse;
}

export interface PollOptions {
  intervalMs?: number;
  timeoutMs?: number;
}

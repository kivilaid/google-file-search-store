import { GoogleGenAI } from '@google/genai';
import type {
  FileSearchStoreClientConfig,
  CreateStoreOptions,
  ListStoresOptions,
  DeleteStoreOptions,
  UploadDocumentOptions,
  ImportDocumentOptions,
  ListDocumentsOptions,
  QueryOptions,
  QueryResult,
  PollOptions,
} from './types.js';
import { ApiKeyMissingError } from './errors.js';
import { createStore, listStores, getStore, deleteStore } from './stores.js';
import { uploadDocument, importDocument, listDocuments, getDocument, deleteDocument } from './documents.js';
import { query } from './query.js';

export class FileSearchStoreClient {
  private ai: GoogleGenAI;
  private defaultModel: string;

  constructor(config?: FileSearchStoreClientConfig) {
    const apiKey = config?.apiKey ?? process.env.GEMINI_API_KEY ?? process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      throw new ApiKeyMissingError();
    }
    this.ai = new GoogleGenAI({ apiKey });
    this.defaultModel = config?.model ?? 'gemini-3-flash-preview';
  }

  async createStore(options: CreateStoreOptions) {
    return createStore(this.ai, options);
  }

  async listStores(options?: ListStoresOptions) {
    return listStores(this.ai, options);
  }

  async getStore(name: string) {
    return getStore(this.ai, name);
  }

  async deleteStore(name: string, options?: DeleteStoreOptions) {
    return deleteStore(this.ai, name, options);
  }

  async uploadDocument(options: UploadDocumentOptions, pollOptions?: PollOptions) {
    return uploadDocument(this.ai, options, pollOptions);
  }

  async importDocument(options: ImportDocumentOptions, pollOptions?: PollOptions) {
    return importDocument(this.ai, options, pollOptions);
  }

  async listDocuments(options: ListDocumentsOptions) {
    return listDocuments(this.ai, options);
  }

  async getDocument(name: string) {
    return getDocument(this.ai, name);
  }

  async deleteDocument(name: string) {
    return deleteDocument(this.ai, name);
  }

  async query(options: QueryOptions): Promise<QueryResult> {
    return query(this.ai, { ...options, model: options.model ?? this.defaultModel });
  }
}

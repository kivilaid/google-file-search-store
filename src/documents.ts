import type { GoogleGenAI } from '@google/genai';
import { lookup } from 'mime-types';
import type {
  UploadDocumentOptions,
  ImportDocumentOptions,
  ListDocumentsOptions,
  PollOptions,
} from './types.js';
import { pollOperation } from './operations.js';

function buildChunkingConfig(options: UploadDocumentOptions | ImportDocumentOptions) {
  if (!options.chunkingConfig) return undefined;
  return {
    whiteSpaceConfig: {
      maxTokensPerChunk: options.chunkingConfig.maxTokensPerChunk,
      maxOverlapTokens: options.chunkingConfig.maxOverlapTokens,
    },
  };
}

function buildCustomMetadata(options: UploadDocumentOptions | ImportDocumentOptions) {
  if (!options.metadata?.length) return undefined;
  return options.metadata.map((m) => ({
    key: m.key,
    stringValue: m.stringValue,
    numericValue: m.numericValue,
  }));
}

export async function uploadDocument(
  ai: GoogleGenAI,
  options: UploadDocumentOptions,
  pollOptions?: PollOptions
) {
  const mimeType = lookup(options.filePath) || 'application/octet-stream';
  const operation = await ai.fileSearchStores.uploadToFileSearchStore({
    file: options.filePath,
    fileSearchStoreName: options.storeNameOrId,
    config: {
      displayName: options.displayName,
      chunkingConfig: buildChunkingConfig(options),
      customMetadata: buildCustomMetadata(options),
      mimeType,
    },
  });
  return pollOperation(ai, operation, pollOptions);
}

export async function importDocument(
  ai: GoogleGenAI,
  options: ImportDocumentOptions,
  pollOptions?: PollOptions
) {
  const operation = await ai.fileSearchStores.importFile({
    fileSearchStoreName: options.storeNameOrId,
    fileName: options.filesApiName,
    config: {
      chunkingConfig: buildChunkingConfig(options),
      customMetadata: buildCustomMetadata(options),
    },
  });
  return pollOperation(ai, operation, pollOptions);
}

export async function listDocuments(ai: GoogleGenAI, options: ListDocumentsOptions) {
  return ai.fileSearchStores.documents.list({
    parent: options.storeNameOrId,
    config: {
      pageSize: options.pageSize,
      pageToken: options.pageToken,
    },
  });
}

export async function getDocument(ai: GoogleGenAI, name: string) {
  return ai.fileSearchStores.documents.get({ name });
}

export async function deleteDocument(ai: GoogleGenAI, name: string) {
  return ai.fileSearchStores.documents.delete({ name });
}

export { FileSearchStoreClient } from './client.js';
export type {
  FileSearchStoreClientConfig,
  CreateStoreOptions,
  ListStoresOptions,
  DeleteStoreOptions,
  ChunkingConfig,
  DocumentMetadata,
  UploadDocumentOptions,
  ImportDocumentOptions,
  ListDocumentsOptions,
  QueryOptions,
  Citation,
  QueryResult,
  PollOptions,
} from './types.js';
export {
  FileSearchStoreError,
  OperationTimeoutError,
  OperationFailedError,
  ApiKeyMissingError,
} from './errors.js';

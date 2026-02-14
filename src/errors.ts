export class FileSearchStoreError extends Error {
  constructor(message: string, public cause?: unknown) {
    super(message);
    this.name = 'FileSearchStoreError';
  }
}

export class OperationTimeoutError extends FileSearchStoreError {
  constructor(operationName: string, timeoutMs: number) {
    super(`Operation "${operationName}" timed out after ${timeoutMs}ms`);
    this.name = 'OperationTimeoutError';
  }
}

export class OperationFailedError extends FileSearchStoreError {
  constructor(operationName: string, details?: unknown) {
    super(`Operation "${operationName}" failed`);
    this.name = 'OperationFailedError';
    this.cause = details;
  }
}

export class ApiKeyMissingError extends FileSearchStoreError {
  constructor() {
    super('API key is required. Set GEMINI_API_KEY environment variable or pass apiKey in config.');
    this.name = 'ApiKeyMissingError';
  }
}

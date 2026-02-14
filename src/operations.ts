import type { GoogleGenAI } from '@google/genai';
import type { PollOptions } from './types.js';
import { OperationTimeoutError, OperationFailedError } from './errors.js';

const DEFAULT_INTERVAL_MS = 2000;
const DEFAULT_TIMEOUT_MS = 5 * 60 * 1000;

export async function pollOperation(
  ai: GoogleGenAI,
  operation: any,
  options?: PollOptions
): Promise<any> {
  const intervalMs = options?.intervalMs ?? DEFAULT_INTERVAL_MS;
  const timeoutMs = options?.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const startTime = Date.now();

  let current = operation;
  while (!current.done) {
    if (Date.now() - startTime > timeoutMs) {
      throw new OperationTimeoutError(current.name ?? 'unknown', timeoutMs);
    }
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
    current = await ai.operations.get({ operation: current });
  }

  if (current.error) {
    throw new OperationFailedError(current.name ?? 'unknown', current.error);
  }

  return current;
}

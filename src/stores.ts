import type { GoogleGenAI } from '@google/genai';
import type { CreateStoreOptions, ListStoresOptions, DeleteStoreOptions } from './types.js';

export async function createStore(ai: GoogleGenAI, options: CreateStoreOptions) {
  return ai.fileSearchStores.create({
    config: { displayName: options.displayName },
  });
}

export async function listStores(ai: GoogleGenAI, options?: ListStoresOptions) {
  return ai.fileSearchStores.list({
    config: {
      pageSize: options?.pageSize,
      pageToken: options?.pageToken,
    },
  });
}

export async function getStore(ai: GoogleGenAI, name: string) {
  return ai.fileSearchStores.get({ name });
}

export async function deleteStore(ai: GoogleGenAI, name: string, options?: DeleteStoreOptions) {
  return ai.fileSearchStores.delete({ name, config: { force: options?.force } });
}

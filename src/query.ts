import type { GoogleGenAI } from '@google/genai';
import type { QueryOptions, QueryResult, Citation } from './types.js';

const DEFAULT_MODEL = 'gemini-3-flash-preview';

export async function query(ai: GoogleGenAI, options: QueryOptions): Promise<QueryResult> {
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
      ...(options.systemInstruction ? { systemInstruction: options.systemInstruction } : {}),
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
  if (groundingMetadata?.groundingSupports) {
    for (const support of groundingMetadata.groundingSupports) {
      if (support.segment) {
        for (const idx of support.groundingChunkIndices ?? []) {
          if (citations[idx]) {
            citations[idx].startIndex = support.segment.startIndex;
            citations[idx].endIndex = support.segment.endIndex;
          }
        }
      }
    }
  }

  return { text, citations, rawResponse: response };
}

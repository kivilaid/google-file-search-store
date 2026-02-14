import { NextResponse } from 'next/server';
import { queryStore } from '../../../lib/client';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { storeNames, query, model, metadataFilter, ...rest } = body;

    if (!storeNames || !Array.isArray(storeNames) || storeNames.length === 0) {
      return NextResponse.json({ error: 'storeNames is required and must be a non-empty array' }, { status: 400 });
    }

    if (!query) {
      return NextResponse.json({ error: 'query is required' }, { status: 400 });
    }

    const result = await queryStore({
      storeNames,
      query,
      model: model ?? undefined,
      metadataFilter: metadataFilter ?? undefined,
      retrievalTopK: rest.retrievalTopK ?? undefined,
      systemInstruction: rest.systemInstruction ?? undefined,
      temperature: rest.temperature ?? undefined,
      topP: rest.topP ?? undefined,
      topK: rest.topK ?? undefined,
      maxOutputTokens: rest.maxOutputTokens ?? undefined,
      stopSequences: rest.stopSequences ?? undefined,
      presencePenalty: rest.presencePenalty ?? undefined,
      frequencyPenalty: rest.frequencyPenalty ?? undefined,
      seed: rest.seed ?? undefined,
      responseMimeType: rest.responseMimeType ?? undefined,
    });

    return NextResponse.json({
      text: result.text,
      citations: result.citations,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to query stores' },
      { status: 500 },
    );
  }
}

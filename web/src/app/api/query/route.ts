import { NextResponse } from 'next/server';
import { queryStore } from '../../../lib/client';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { storeNames, query, model, metadataFilter } = body;

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

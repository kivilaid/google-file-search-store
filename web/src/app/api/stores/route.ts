import { NextResponse } from 'next/server';
import { createStore, listStores, invalidateCache } from '../../../lib/client';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { displayName } = body;

    if (!displayName) {
      return NextResponse.json({ error: 'displayName is required' }, { status: 400 });
    }

    const store = await createStore(displayName);
    invalidateCache('stores:');
    return NextResponse.json(store);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create store' },
      { status: 500 },
    );
  }
}

export async function GET() {
  try {
    const stores = await listStores({ includeDocumentCounts: true });
    return NextResponse.json({ stores: stores ?? [] });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to list stores' },
      { status: 500 },
    );
  }
}

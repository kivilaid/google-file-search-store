import { NextResponse } from 'next/server';
import { getStore, deleteStore, invalidateCache } from '../../../../lib/client';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const store = await getStore(`fileSearchStores/${id}`);
    return NextResponse.json(store);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get store' },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const url = new URL(request.url);
    const force = url.searchParams.get('force') === 'true';

    await deleteStore(`fileSearchStores/${id}`, force);
    invalidateCache();
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete store' },
      { status: 500 },
    );
  }
}

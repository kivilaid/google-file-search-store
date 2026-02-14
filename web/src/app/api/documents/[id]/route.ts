import { NextResponse } from 'next/server';
import { deleteDocument } from '../../../../lib/client';

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    await deleteDocument(`fileSearchStoreDocuments/${id}`);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete document' },
      { status: 500 },
    );
  }
}

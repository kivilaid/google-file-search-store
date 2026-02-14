import { NextResponse } from 'next/server';
import { writeFile, unlink } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';
import { uploadDocument, listDocuments } from '../../../../../lib/client';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  let tempPath: string | null = null;

  try {
    const { id } = await params;
    const formData = await request.formData();

    const file = formData.get('file') as File | null;
    if (!file) {
      return NextResponse.json({ error: 'file is required' }, { status: 400 });
    }

    const displayName = formData.get('displayName') as string | null;
    const maxTokensPerChunk = formData.get('maxTokensPerChunk') as string | null;
    const maxOverlapTokens = formData.get('maxOverlapTokens') as string | null;
    const metadataStr = formData.get('metadata') as string | null;

    const bytes = await file.arrayBuffer();
    tempPath = join(tmpdir(), `upload-${Date.now()}-${file.name}`);
    await writeFile(tempPath, Buffer.from(bytes));

    const document = await uploadDocument({
      storeNameOrId: `fileSearchStores/${id}`,
      filePath: tempPath,
      displayName: displayName ?? undefined,
      chunkingConfig:
        maxTokensPerChunk || maxOverlapTokens
          ? {
              maxTokensPerChunk: maxTokensPerChunk ? parseInt(maxTokensPerChunk, 10) : undefined,
              maxOverlapTokens: maxOverlapTokens ? parseInt(maxOverlapTokens, 10) : undefined,
            }
          : undefined,
      metadata: metadataStr ? JSON.parse(metadataStr) : undefined,
    });

    return NextResponse.json(document);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to upload document' },
      { status: 500 },
    );
  } finally {
    if (tempPath) {
      await unlink(tempPath).catch(() => {});
    }
  }
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const documents = await listDocuments(`fileSearchStores/${id}`);
    return NextResponse.json({ documents: documents ?? [] });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to list documents' },
      { status: 500 },
    );
  }
}

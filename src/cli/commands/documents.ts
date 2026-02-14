import { Command } from 'commander';
import { FileSearchStoreClient } from '../../client.js';
import type { DocumentMetadata } from '../../types.js';
import { formatTable, formatJson, handleError } from '../utils.js';

function parseMetadata(values: string[]): DocumentMetadata[] {
  return values.map((v) => {
    const eqIndex = v.indexOf('=');
    if (eqIndex === -1) {
      throw new Error(`Invalid metadata format: "${v}". Expected key=value.`);
    }
    const key = v.slice(0, eqIndex);
    const raw = v.slice(eqIndex + 1);
    const num = Number(raw);
    if (!isNaN(num) && raw.trim() !== '') {
      return { key, numericValue: num };
    }
    return { key, stringValue: raw };
  });
}

export const docCommand = new Command('doc').description('Manage documents');

docCommand
  .command('upload')
  .description('Upload a file to a store')
  .argument('<store-name>', 'Store resource name')
  .argument('<file-path>', 'Path to the file to upload')
  .option('--display-name <name>', 'Display name for the document')
  .option('--max-tokens <n>', 'Max tokens per chunk', parseInt)
  .option('--overlap <n>', 'Max overlap tokens between chunks', parseInt)
  .option('--meta <key=value...>', 'Metadata key=value pairs', (val: string, prev: string[]) => {
    prev.push(val);
    return prev;
  }, [])
  .action(async (storeName: string, filePath: string, opts) => {
    try {
      const client = new FileSearchStoreClient();
      const chunkingConfig =
        opts.maxTokens || opts.overlap
          ? { maxTokensPerChunk: opts.maxTokens, maxOverlapTokens: opts.overlap }
          : undefined;
      const metadata = opts.meta.length > 0 ? parseMetadata(opts.meta) : undefined;

      const doc = await client.uploadDocument({
        storeNameOrId: storeName,
        filePath,
        displayName: opts.displayName,
        chunkingConfig,
        metadata,
      });
      console.log(`Uploaded document: ${doc.name}`);
    } catch (error) {
      handleError(error);
    }
  });

docCommand
  .command('import')
  .description('Import a document from the Files API')
  .argument('<store-name>', 'Store resource name')
  .argument('<files-api-name>', 'Files API resource name')
  .action(async (storeName: string, filesApiName: string) => {
    try {
      const client = new FileSearchStoreClient();
      const doc = await client.importDocument({
        storeNameOrId: storeName,
        filesApiName,
      });
      console.log(`Imported document: ${doc.name}`);
    } catch (error) {
      handleError(error);
    }
  });

docCommand
  .command('list')
  .description('List documents in a store')
  .argument('<store-name>', 'Store resource name')
  .option('--json', 'Output as JSON')
  .action(async (storeName: string, opts) => {
    try {
      const client = new FileSearchStoreClient();
      const pager = await client.listDocuments({ storeNameOrId: storeName });
      const docs = pager.page ?? [];

      if (opts.json) {
        console.log(formatJson(docs));
        return;
      }

      if (docs.length === 0) {
        console.log('No documents found.');
        return;
      }

      const headers = ['NAME', 'DISPLAY NAME', 'CREATE TIME'];
      const rows = docs.map((d) => [
        String(d.name ?? ''),
        String(d.displayName ?? ''),
        String(d.createTime ?? ''),
      ]);
      console.log(formatTable(headers, rows));
    } catch (error) {
      handleError(error);
    }
  });

docCommand
  .command('get')
  .description('Get document details')
  .argument('<doc-name>', 'Document resource name')
  .action(async (docName: string) => {
    try {
      const client = new FileSearchStoreClient();
      const doc = await client.getDocument(docName);
      console.log(formatJson(doc));
    } catch (error) {
      handleError(error);
    }
  });

docCommand
  .command('delete')
  .description('Delete a document')
  .argument('<doc-name>', 'Document resource name')
  .action(async (docName: string) => {
    try {
      const client = new FileSearchStoreClient();
      await client.deleteDocument(docName);
      console.log(`Deleted document: ${docName}`);
    } catch (error) {
      handleError(error);
    }
  });

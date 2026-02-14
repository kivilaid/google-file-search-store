import { Command } from 'commander';
import { FileSearchStoreClient } from '../../client.js';
import { formatJson, handleError } from '../utils.js';

export const queryCommand = new Command('query')
  .description('Query a store with a question')
  .argument('<store-name>', 'Store resource name')
  .argument('<question>', 'The question to ask')
  .option('--model <model>', 'Model to use for generation')
  .option('--filter <filter>', 'Metadata filter expression')
  .option('--show-citations', 'Show citation details')
  .option('--json', 'Output full JSON result')
  .action(async (storeName: string, question: string, opts) => {
    try {
      const client = new FileSearchStoreClient();
      const result = await client.query({
        storeNames: [storeName],
        query: question,
        model: opts.model,
        metadataFilter: opts.filter,
      });

      if (opts.json) {
        console.log(formatJson({ text: result.text, citations: result.citations }));
        return;
      }

      console.log(result.text);

      if (opts.showCitations && result.citations.length > 0) {
        console.log('\n--- Citations ---');
        for (const c of result.citations) {
          const parts: string[] = [];
          if (c.title) parts.push(`Title: ${c.title}`);
          if (c.uri) parts.push(`URI: ${c.uri}`);
          if (c.snippet) parts.push(`Snippet: ${c.snippet}`);
          if (c.startIndex != null || c.endIndex != null) {
            parts.push(`Range: ${c.startIndex ?? 0}-${c.endIndex ?? '?'}`);
          }
          console.log(`  ${parts.join(' | ')}`);
        }
      }
    } catch (error) {
      handleError(error);
    }
  });

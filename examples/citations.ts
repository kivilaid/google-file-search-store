import 'dotenv/config';
import { writeFileSync, unlinkSync } from 'node:fs';
import { join } from 'node:path';
import { FileSearchStoreClient } from '../src/index.js';

async function main() {
  const client = new FileSearchStoreClient();

  // Create a temporary document
  const filePath = join(import.meta.dirname, 'citations-sample.txt');
  writeFileSync(
    filePath,
    [
      'The Theory of Relativity was published by Albert Einstein in 1905.',
      'General relativity describes gravity as the curvature of spacetime.',
      'Special relativity introduced the famous equation E=mc^2.',
      'Time dilation occurs when objects travel at speeds close to the speed of light.',
      'Gravitational waves were first detected by LIGO in 2015.',
    ].join('\n'),
  );

  console.log('Creating store...');
  const store = await client.createStore({ displayName: 'Citations Example Store' });
  const storeName = store.name!;
  console.log(`Store created: ${storeName}`);

  try {
    console.log('Uploading document...');
    const doc = await client.uploadDocument({
      storeNameOrId: storeName,
      filePath,
      displayName: 'relativity.txt',
    });
    console.log(`Document uploaded: ${doc.name}`);

    console.log('Querying the store...');
    const result = await client.query({
      storeNames: [storeName],
      query: 'What is the theory of relativity and what are gravitational waves?',
    });

    console.log('\n--- Answer ---');
    console.log(result.text);

    console.log('\n--- Citations ---');
    if (result.citations.length === 0) {
      console.log('No citations returned.');
    }
    for (const [i, citation] of result.citations.entries()) {
      console.log(`\n[${i + 1}]`);
      console.log(`  Title:      ${citation.title ?? '(none)'}`);
      console.log(`  URI:        ${citation.uri ?? '(none)'}`);
      console.log(`  Snippet:    ${citation.snippet ?? '(none)'}`);
      console.log(`  StartIndex: ${citation.startIndex ?? '(none)'}`);
      console.log(`  EndIndex:   ${citation.endIndex ?? '(none)'}`);
    }
  } finally {
    console.log('\nCleaning up...');
    await client.deleteStore(storeName, { force: true });
    console.log('Store deleted.');
    unlinkSync(filePath);
  }
}

main().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});

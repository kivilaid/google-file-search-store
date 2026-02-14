import 'dotenv/config';
import { writeFileSync, unlinkSync } from 'node:fs';
import { join } from 'node:path';
import { FileSearchStoreClient } from '../src/index.js';

async function main() {
  const client = new FileSearchStoreClient();

  // Determine the file to upload: use CLI arg or create a sample file
  const samplePath = join(import.meta.dirname, 'sample.txt');
  const filePath = process.argv[2] ?? samplePath;
  let createdSample = false;

  if (!process.argv[2]) {
    writeFileSync(
      samplePath,
      [
        'Artificial intelligence (AI) is the simulation of human intelligence by machines.',
        'Machine learning is a subset of AI that enables systems to learn from data.',
        'Deep learning uses neural networks with many layers to model complex patterns.',
        'Natural language processing (NLP) allows machines to understand human language.',
        'Reinforcement learning trains agents through rewards and penalties.',
      ].join('\n'),
    );
    createdSample = true;
  }

  console.log('Creating store...');
  const store = await client.createStore({ displayName: 'Example Store' });
  const storeName = store.name!;
  console.log(`Store created: ${storeName}`);

  try {
    console.log('Uploading document...');
    const doc = await client.uploadDocument({
      storeNameOrId: storeName,
      filePath,
      displayName: 'sample.txt',
    });
    console.log(`Document uploaded: ${doc.name}`);

    console.log('Querying the store...');
    const result = await client.query({
      storeNames: [storeName],
      query: 'What is machine learning?',
    });

    console.log('\n--- Answer ---');
    console.log(result.text);
    console.log(`\nCitations: ${result.citations.length}`);
  } finally {
    console.log('\nCleaning up...');
    await client.deleteStore(storeName, { force: true });
    console.log('Store deleted.');

    if (createdSample) {
      unlinkSync(samplePath);
    }
  }
}

main().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});

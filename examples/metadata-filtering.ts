import 'dotenv/config';
import { writeFileSync, unlinkSync } from 'node:fs';
import { join } from 'node:path';
import { FileSearchStoreClient } from '../src/index.js';

async function main() {
  const client = new FileSearchStoreClient();

  // Create a temporary document
  const filePath = join(import.meta.dirname, 'metadata-sample.txt');
  writeFileSync(
    filePath,
    [
      'Research paper by Dr. Smith on quantum computing advances in 2024.',
      'Quantum entanglement enables instantaneous state correlation between particles.',
      'Quantum error correction is essential for building reliable quantum computers.',
      'Superconducting qubits are the most widely used technology for quantum processors.',
    ].join('\n'),
  );

  console.log('Creating store...');
  const store = await client.createStore({ displayName: 'Metadata Example Store' });
  const storeName = store.name!;
  console.log(`Store created: ${storeName}`);

  try {
    console.log('Uploading document with metadata...');
    const doc = await client.uploadDocument({
      storeNameOrId: storeName,
      filePath,
      displayName: 'quantum-research.txt',
      metadata: [
        { key: 'author', stringValue: 'Smith' },
        { key: 'year', numericValue: 2024 },
      ],
    });
    console.log(`Document uploaded: ${doc.name}`);

    console.log('Querying with metadata filter: author="Smith"...');
    const result = await client.query({
      storeNames: [storeName],
      query: 'What are the advances in quantum computing?',
      metadataFilter: 'author="Smith"',
    });

    console.log('\n--- Answer ---');
    console.log(result.text);
    console.log(`\nCitations: ${result.citations.length}`);
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

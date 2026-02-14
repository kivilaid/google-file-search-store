import { FileSearchStoreError } from '../errors.js';

export function formatTable(headers: string[], rows: string[][]): string {
  const widths = headers.map((h, i) =>
    Math.max(h.length, ...rows.map(r => (r[i] ?? '').length))
  );

  const sep = widths.map(w => '-'.repeat(w)).join('  ');
  const header = headers.map((h, i) => h.padEnd(widths[i])).join('  ');
  const body = rows
    .map(row => row.map((cell, i) => (cell ?? '').padEnd(widths[i])).join('  '))
    .join('\n');

  return `${header}\n${sep}\n${body}`;
}

export function formatJson(data: unknown): string {
  return JSON.stringify(data, null, 2);
}

export function handleError(error: unknown): never {
  if (error instanceof FileSearchStoreError) {
    console.error(`Error: ${error.message}`);
  } else if (error instanceof Error) {
    console.error(`Error: ${error.message}`);
  } else {
    console.error('An unexpected error occurred.');
  }
  process.exit(1);
}

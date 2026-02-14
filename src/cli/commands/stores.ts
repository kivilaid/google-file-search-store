import { Command } from 'commander';
import { FileSearchStoreClient } from '../../client.js';
import { formatTable, formatJson, handleError } from '../utils.js';

export const storeCommand = new Command('store').description('Manage file search stores');

storeCommand
  .command('create')
  .description('Create a new store')
  .requiredOption('--name <name>', 'Display name for the store')
  .action(async (opts) => {
    try {
      const client = new FileSearchStoreClient();
      const store = await client.createStore({ displayName: opts.name });
      console.log(`Created store: ${store.displayName ?? store.name}`);
      console.log(`Name: ${store.name}`);
    } catch (error) {
      handleError(error);
    }
  });

storeCommand
  .command('list')
  .description('List all stores')
  .option('--json', 'Output as JSON')
  .action(async (opts) => {
    try {
      const client = new FileSearchStoreClient();
      const pager = await client.listStores();
      const stores = pager.page ?? [];

      if (opts.json) {
        console.log(formatJson(stores));
        return;
      }

      if (stores.length === 0) {
        console.log('No stores found.');
        return;
      }

      const headers = ['NAME', 'DISPLAY NAME', 'CREATE TIME'];
      const rows = stores.map((s) => [
        String(s.name ?? ''),
        String(s.displayName ?? ''),
        String(s.createTime ?? ''),
      ]);
      console.log(formatTable(headers, rows));
    } catch (error) {
      handleError(error);
    }
  });

storeCommand
  .command('get')
  .description('Get store details')
  .argument('<store-name>', 'Store resource name')
  .action(async (storeName: string) => {
    try {
      const client = new FileSearchStoreClient();
      const store = await client.getStore(storeName);
      console.log(formatJson(store));
    } catch (error) {
      handleError(error);
    }
  });

storeCommand
  .command('delete')
  .description('Delete a store')
  .argument('<store-name>', 'Store resource name')
  .option('--force', 'Force delete even if store contains documents')
  .action(async (storeName: string, opts) => {
    try {
      const client = new FileSearchStoreClient();
      await client.deleteStore(storeName, { force: opts.force });
      console.log(`Deleted store: ${storeName}`);
    } catch (error) {
      handleError(error);
    }
  });

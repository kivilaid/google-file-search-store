#!/usr/bin/env node

import 'dotenv/config';
import { createRequire } from 'module';
import { Command } from 'commander';
import { storeCommand } from './commands/stores.js';
import { docCommand } from './commands/documents.js';
import { queryCommand } from './commands/query.js';

const require = createRequire(import.meta.url);
const pkg = require('../../package.json');

const program = new Command();

program
  .name('gfss')
  .description('CLI for Google Gemini File Search Store API')
  .version(pkg.version);

program.addCommand(storeCommand);
program.addCommand(docCommand);
program.addCommand(queryCommand);

program.parse();

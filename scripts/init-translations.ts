#!/usr/bin/env node
import { execSync } from 'child_process';
import { log } from './utils/logger.js';

/**
 * Initialize project/ for translation work
 * - Cleans existing files
 * - Extracts and decompiles game from ZIP
 * - Indexes for translation
 */

const steps = [
  { name: 'clean', command: 'vite-node scripts/clean-project.ts' },
  { name: 'setup', command: 'vite-node scripts/setup-project.ts' },
  { name: 'index', command: 'vite-node scripts/index-all.ts project' }
];

log.info('Starting translation initialization workflow...');
log.newline();

for (const step of steps) {
  log.info(`Step: ${step.name}`);
  try {
    execSync(step.command, { stdio: 'inherit' });
    log.success(`✓ ${step.name} completed`);
    log.newline();
  } catch (error) {
    log.error(`✗ ${step.name} failed`);
    process.exit(1);
  }
}

log.success('Translation initialization complete!');
log.info('Next steps:');
log.info('  1. Run: npm run extract-translations');
log.info('  2. Edit translation files in active-translation/');
log.info('  3. Copy active-translation/ to translations/<name>/ when ready');
log.info('  4. Run: npm run release <name>');
log.newline();
log.info('For dev testing:');
log.info('  npm run release:dev <translation-name>');

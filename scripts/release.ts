#!/usr/bin/env node
import { execSync } from 'child_process';
import { log } from './utils/logger.js';

/**
 * Build a release from translations
 * - Imports translations from translations/<subdir>/
 * - Builds game with agikit
 * - Creates zip file
 */

const translationSubdir = process.argv[2];

if (!translationSubdir) {
  log.error('Usage: vite-node scripts/release.ts <translation-subdir>');
  log.error('Example: vite-node scripts/release.ts sq2');
  log.error('Example: vite-node scripts/release.ts example');
  process.exit(1);
}

const steps = [
  {
    name: 'import-translations',
    command: `vite-node scripts/import-translations.ts project ${translationSubdir}`
  },
  { name: 'build', command: 'vite-node scripts/build.ts project' },
  { name: 'zip', command: 'vite-node scripts/zip-build.ts project/final/build' }
];

log.info(`Starting release workflow (translations: ${translationSubdir})`);
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

log.success('Release build complete!');
log.info('Final package: project/final/agi-build.zip');

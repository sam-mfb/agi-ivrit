#!/usr/bin/env node
import { execSync } from 'child_process';
import { log } from './utils/logger.js';

/**
 * Build a dev release for testing
 * - Imports translations from translations/<subdir>/
 * - Builds game with agikit
 * - Copies to play-build/ for ScummVM testing
 */

const translationSubdir = process.argv[2];

if (!translationSubdir) {
  log.error('Usage: vite-node scripts/release-dev.ts <translation-subdir>');
  log.error('Example: vite-node scripts/release-dev.ts sq2');
  log.error('Example: vite-node scripts/release-dev.ts example');
  process.exit(1);
}

const steps = [
  {
    name: 'import-translations',
    command: `vite-node scripts/import-translations.ts project ${translationSubdir}`
  },
  { name: 'build:dev', command: 'vite-node scripts/build.ts project play-build' }
];

log.info(`Starting dev release workflow (translations: ${translationSubdir})`);
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

log.success('Dev build complete!');
log.info('Build ready for testing: play-build/');
log.info('Point ScummVM to this directory to test your changes');

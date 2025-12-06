#!/usr/bin/env node
import { execSync } from 'child_process';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { log } from './utils/logger.js';

/**
 * Fetch a translation from its external repository
 * Clones the translation repo into translations/<name>/
 */

interface TranslationEntry {
  name: string;
  repo: string;
  status: string;
}

interface TranslationsRegistry {
  translations: Record<string, TranslationEntry>;
}

const translationName = process.argv[2];

if (!translationName) {
  log.error('Usage: npm run fetch-translation <name>');
  log.error('Example: npm run fetch-translation sq2');
  log.newline();

  // List available translations
  const registryPath = 'translations.json';
  if (existsSync(registryPath)) {
    const registry: TranslationsRegistry = JSON.parse(readFileSync(registryPath, 'utf-8'));
    const names = Object.keys(registry.translations);
    if (names.length > 0) {
      log.info('Available translations:');
      for (const name of names) {
        const entry = registry.translations[name];
        log.info(`  ${name} - ${entry.name} (${entry.status})`);
      }
    }
  }
  process.exit(1);
}

// Don't allow fetching 'example' - it's built-in
if (translationName === 'example') {
  log.error("The 'example' translation is already included in this repo.");
  process.exit(1);
}

// Load registry
const registryPath = 'translations.json';
if (!existsSync(registryPath)) {
  log.error('translations.json not found');
  process.exit(1);
}

const registry: TranslationsRegistry = JSON.parse(readFileSync(registryPath, 'utf-8'));
const entry = registry.translations[translationName];

if (!entry) {
  log.error(`Translation '${translationName}' not found in registry.`);
  log.newline();
  const names = Object.keys(registry.translations);
  if (names.length > 0) {
    log.info('Available translations:');
    for (const name of names) {
      const e = registry.translations[name];
      log.info(`  ${name} - ${e.name} (${e.status})`);
    }
  }
  process.exit(1);
}

const targetDir = join('translations', translationName);

// Check if already exists
if (existsSync(targetDir)) {
  log.error(`Directory already exists: ${targetDir}`);
  log.info('To update, delete the directory and run this command again.');
  process.exit(1);
}

log.section(`Fetching ${entry.name}`);
log.newline();
log.info(`Repository: ${entry.repo}`);
log.info(`Target: ${targetDir}`);
log.newline();

try {
  execSync(`git clone "${entry.repo}" "${targetDir}"`, { stdio: 'inherit' });
  log.newline();
  log.success(`Successfully fetched '${translationName}' translation.`);
  log.newline();
  log.info('Next steps:');
  log.info('1. Put your legally-acquired game zip in project/');
  log.info('2. Run: npm run init-translations');
  log.info(`3. Run: npm run release ${translationName}`);
} catch (error) {
  log.error('Failed to clone repository.');
  process.exit(1);
}

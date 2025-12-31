#!/usr/bin/env node
import { execSync } from 'child_process';
import { existsSync, mkdirSync, rmSync } from 'fs';
import { log } from './utils/logger.js';
import { ensureGraft, runGraft, PATCHER_TARGETS } from './utils/graft.js';

/**
 * Build patch files and patcher executables from translations
 * - Imports translations from translations/<subdir>/
 * - Builds game with agikit
 * - Creates graft patches comparing original and translated builds
 * - Creates patcher executables for all platforms
 */

const translationSubdir = process.argv[2];

if (!translationSubdir) {
  log.error('Usage: vite-node scripts/release-patch.ts <translation-subdir>');
  log.error('Example: vite-node scripts/release-patch.ts sq1');
  process.exit(1);
}

const ORIG_DIR = 'project/orig';
const BUILD_DIR = 'project/final/build';
const PATCHES_DIR = 'project/patches';
const PATCHERS_DIR = 'project/patchers';

async function main() {
  // Step 1: Validate original game files exist
  log.section('Validating original game files');
  if (!existsSync(ORIG_DIR)) {
    log.error(`Original game files not found at ${ORIG_DIR}`);
    log.error('Please extract the original game files to project/orig/ before running release:patch');
    process.exit(1);
  }
  log.success(`Found original game files at ${ORIG_DIR}`);

  // Step 2: Import translations
  log.section('Importing translations');
  try {
    execSync(`vite-node scripts/import-translations.ts project ${translationSubdir}`, {
      stdio: 'inherit'
    });
    log.success('Translations imported');
  } catch (error) {
    log.error('Failed to import translations');
    process.exit(1);
  }

  // Step 3: Build
  log.section('Building game');
  try {
    execSync('vite-node scripts/build.ts project', { stdio: 'inherit' });
    log.success('Game built');
  } catch (error) {
    log.error('Failed to build game');
    process.exit(1);
  }

  // Step 4: Ensure graft is available
  log.section('Setting up graft');
  let graftPath: string;
  try {
    graftPath = await ensureGraft();
    log.success('Graft binary ready');
  } catch (error) {
    log.error(`Failed to set up graft: ${error instanceof Error ? error.message : error}`);
    process.exit(1);
  }

  // Step 5: Create patches
  log.section('Creating patches');
  // Clean patches directory
  if (existsSync(PATCHES_DIR)) {
    rmSync(PATCHES_DIR, { recursive: true, force: true });
  }
  mkdirSync(PATCHES_DIR, { recursive: true });

  try {
    runGraft(graftPath, ['patch', 'create', ORIG_DIR, BUILD_DIR, PATCHES_DIR]);
    log.success(`Patches created at ${PATCHES_DIR}`);
  } catch (error) {
    log.error('Failed to create patches');
    process.exit(1);
  }

  // Step 6: Create patcher executables for all platforms
  log.section('Creating patcher executables');
  // Clean patchers directory
  if (existsSync(PATCHERS_DIR)) {
    rmSync(PATCHERS_DIR, { recursive: true, force: true });
  }
  mkdirSync(PATCHERS_DIR, { recursive: true });

  for (const { target, suffix } of PATCHER_TARGETS) {
    const outputPath = `${PATCHERS_DIR}/${translationSubdir}-patcher${suffix}`;
    log.info(`Creating patcher for ${target}...`);
    try {
      runGraft(graftPath, ['patcher', 'create', PATCHES_DIR, '--target', target, '-o', outputPath]);
      log.success(`Created ${outputPath}`);
    } catch (error) {
      log.error(`Failed to create patcher for ${target}`);
      process.exit(1);
    }
  }

  log.newline();
  log.success('Release patch build complete!');
  log.info(`Patches: ${PATCHES_DIR}`);
  log.info(`Patchers: ${PATCHERS_DIR}`);
}

main().catch((error) => {
  log.error(`Unexpected error: ${error instanceof Error ? error.message : error}`);
  process.exit(1);
});

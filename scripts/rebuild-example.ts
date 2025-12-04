#!/usr/bin/env node
import { execSync } from 'child_process';
import { existsSync, rmSync, mkdirSync } from 'fs';
import { log } from './utils/logger.js';

/**
 * Rebuild the example game from example/src/
 * Creates example/example.zip for distribution
 */

const srcDir = 'example/src';
const buildDir = 'example/build';
const zipFile = 'example/example.zip';

log.info('Rebuilding example game...');
log.newline();

// Verify src directory exists
if (!existsSync(srcDir)) {
  log.error(`Source directory not found: ${srcDir}`);
  process.exit(1);
}

// Clean build directory
if (existsSync(buildDir)) {
  log.info('Cleaning existing build directory...');
  rmSync(buildDir, { recursive: true, force: true });
}
mkdirSync(buildDir, { recursive: true });

// Build with agikit
log.info('Building with agikit...');
try {
  execSync(`agikit build ./example --encoding windows-1255`, { stdio: 'inherit' });
  log.success('Build completed');
} catch (error) {
  log.error('Build failed');
  process.exit(1);
}

// Remove existing zip
if (existsSync(zipFile)) {
  log.info('Removing existing zip...');
  rmSync(zipFile);
}

// Create zip
log.info('Creating zip file...');
try {
  execSync(`cd example && zip -r example.zip build`, { stdio: 'inherit' });
  log.success(`Created ${zipFile}`);
} catch (error) {
  log.error('Failed to create zip');
  process.exit(1);
}

// Clean up build directory
log.info('Cleaning up build directory...');
rmSync(buildDir, { recursive: true, force: true });

log.newline();
log.success('Example game rebuilt!');
log.info(`Output: ${zipFile}`);

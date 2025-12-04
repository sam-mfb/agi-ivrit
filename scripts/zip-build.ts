#!/usr/bin/env node
import { existsSync, readdirSync } from 'fs';
import { join, basename } from 'path';
import { execSync } from 'child_process';
import { log } from './utils/logger.js';

/**
 * Validates that a directory looks like a valid AGI build directory
 * by checking for the presence of compiled AGI files
 */
function isValidBuildDirectory(dir: string): boolean {
  if (!existsSync(dir)) {
    log.error(`Directory does not exist: ${dir}`);
    return false;
  }

  const files = readdirSync(dir);

  // Check for essential AGI files
  const hasVol = files.some(f => f.match(/^VOL\.\d+$/));
  const hasDirs = files.some(f => f.match(/^(LOGDIR|PICDIR|VIEWDIR|SNDDIR)$/));
  const hasObject = files.includes('OBJECT');
  const hasWordsTok = files.includes('WORDS.TOK');

  if (!hasVol) {
    log.error('No VOL.* files found - not a valid AGI build directory');
    return false;
  }

  if (!hasDirs) {
    log.error('No resource directory files (LOGDIR, PICDIR, etc.) found');
    return false;
  }

  if (!hasObject) {
    log.error('OBJECT file not found');
    return false;
  }

  if (!hasWordsTok) {
    log.error('WORDS.TOK file not found');
    return false;
  }

  return true;
}

/**
 * Zips a build directory to agi-build.zip in the parent directory
 */
function zipBuild(buildDir: string): void {
  log.info(`Validating build directory: ${buildDir}`);

  if (!isValidBuildDirectory(buildDir)) {
    log.error('Invalid build directory - aborting');
    process.exit(1);
  }

  log.success('Build directory validated');

  // Get parent directory and build folder name
  const parentDir = join(buildDir, '..');
  const buildFolderName = basename(buildDir);
  const outputZip = join(parentDir, 'agi-build.zip');

  log.info(`Creating zip file: ${outputZip}`);

  // Remove existing zip if present
  if (existsSync(outputZip)) {
    log.info('Removing existing agi-build.zip');
    execSync(`rm -f "${outputZip}"`);
  }

  // Create zip file (using relative paths to avoid including parent directories)
  try {
    execSync(`cd "${parentDir}" && zip -r agi-build.zip "${buildFolderName}"`, {
      stdio: 'inherit'
    });
    log.success(`Build zipped to: ${outputZip}`);
  } catch (error) {
    log.error('Failed to create zip file');
    process.exit(1);
  }
}

// Main execution
const buildDir = process.argv[2];

if (!buildDir) {
  log.error('Usage: vite-node scripts/zip-build.ts <build-directory>');
  log.error('Example: vite-node scripts/zip-build.ts project/tmp/build');
  process.exit(1);
}

zipBuild(buildDir);

#!/usr/bin/env node
import { execSync } from 'child_process';
import { existsSync, cpSync, mkdirSync, rmSync, lstatSync, readdirSync, readlinkSync, realpathSync } from 'fs';
import { join } from 'path';
import { log } from './utils/logger.js';

const projectDir = process.argv[2] || 'project';
const outputDir = process.argv[3]; // Optional alternate output directory
const finalDir = join(projectDir, 'final');
const buildDir = join(finalDir, 'build');

log.info(`Building ${projectDir}/final...`);

try {
  // Run agikit build
  execSync(`agikit build ./${finalDir} --encoding windows-1255`, { stdio: 'inherit' });
  log.success('Build completed');
} catch (error) {
  log.error('Build failed');
  process.exit(1);
}

// Copy Hebrew font to build directory
const hebrewFontSrc = 'hebrew-font.bin';
const hebrewFontDest = join(buildDir, 'agi-font-dos.bin');

if (existsSync(hebrewFontSrc)) {
  log.info('Copying Hebrew font...');
  try {
    cpSync(hebrewFontSrc, hebrewFontDest);
    log.success(`Copied ${hebrewFontSrc} → ${hebrewFontDest}`);
  } catch (error) {
    log.error('Failed to copy Hebrew font');
    process.exit(1);
  }
} else {
  log.info(`Hebrew font not found (${hebrewFontSrc}), skipping font copy`);
}

// Copy WORDS.TOK.EXTENDED to build directory (for ScummVM extended character support)
const wordsExtSrc = join(finalDir, 'WORDS.TOK.EXTENDED');
const wordsExtDest = join(buildDir, 'WORDS.TOK.EXTENDED');

if (existsSync(wordsExtSrc)) {
  log.info('Copying WORDS.TOK.EXTENDED...');
  try {
    cpSync(wordsExtSrc, wordsExtDest);
    log.success(`Copied WORDS.TOK.EXTENDED → ${wordsExtDest}`);
  } catch (error) {
    log.error('Failed to copy WORDS.TOK.EXTENDED');
    process.exit(1);
  }
} else {
  log.info('WORDS.TOK.EXTENDED not found, skipping copy');
}

// Copy to alternate output directory if specified
if (outputDir) {
  log.info(`Copying build to ${outputDir}...`);
  try {
    let targetDir = outputDir;

    // Check if outputDir is a symlink
    if (existsSync(outputDir)) {
      const stats = lstatSync(outputDir);
      if (stats.isSymbolicLink()) {
        // Follow the symlink to get the real directory
        targetDir = realpathSync(outputDir);
        log.info(`Following symlink: ${outputDir} → ${targetDir}`);

        // Clear contents of target directory but keep the symlink
        const files = readdirSync(targetDir);
        for (const file of files) {
          rmSync(join(targetDir, file), { recursive: true, force: true });
        }
      } else if (stats.isDirectory()) {
        // Regular directory - remove and recreate
        rmSync(outputDir, { recursive: true, force: true });
        mkdirSync(outputDir, { recursive: true });
      }
    } else {
      // Doesn't exist - create it
      mkdirSync(outputDir, { recursive: true });
    }

    // Copy build contents to target directory
    cpSync(buildDir, targetDir, { recursive: true });
    log.success(`Build copied to: ${outputDir}`);
    if (targetDir !== outputDir) {
      log.info(`  (actual location: ${targetDir})`);
    }
  } catch (error) {
    log.error(`Failed to copy to ${outputDir}`);
    console.error(error);
    process.exit(1);
  }
}

log.newline();
if (outputDir) {
  log.success(`Build ready: ${outputDir}`);
} else {
  log.success(`Build ready: ${buildDir}`);
}

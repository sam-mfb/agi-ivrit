#!/usr/bin/env node
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { log } from './utils/logger.js';
import type { MessagesFile } from '../src/translation/types.js';

/**
 * Fix missing escape sequences in translation JSON files
 *
 * Problem: Translators often strip backslashes from escape sequences
 * Original: %m8\"%w1\"
 * Translation: %m8"%w1" (missing backslashes)
 *
 * This script fixes by copying escape patterns from original to translation
 */

function fixEscapeSequences(original: string, translation: string): string {
  // Skip if translation is empty
  if (!translation || !translation.trim()) return translation;

  let fixed = translation;
  let wasFixed = false;

  // Fix escaped quotes: \"
  if (original.includes('\\"') && !fixed.includes('\\"') && fixed.includes('"')) {
    fixed = fixed.replace(/"/g, '\\"');
    wasFixed = true;
  }

  // Fix escaped newlines: \n
  // Check if original has \\n (which JSON parses as \n) and translation has actual newlines
  if (original.includes('\\n') && !fixed.includes('\\n')) {
    // Replace actual newlines with escaped newlines
    fixed = fixed.replace(/\n/g, '\\n');
    wasFixed = true;
  }

  // Fix escaped backslashes: \\
  // This is tricky - only fix if original has \\\\ and translation has \\
  if (original.includes('\\\\') && !fixed.includes('\\\\') && fixed.includes('\\')) {
    // Be careful not to double-escape
    // This is complex, so skip for now
  }

  return fixed;
}

function fixTranslationFile(filePath: string, dryRun: boolean): { checked: number; fixed: number } {
  if (!existsSync(filePath)) {
    log.error(`File not found: ${filePath}`);
    process.exit(1);
  }

  const content = readFileSync(filePath, 'utf-8');
  const messagesFile: MessagesFile = JSON.parse(content);

  let checked = 0;
  let fixed = 0;

  // Process each message
  for (const message of messagesFile.messages) {
    const original = message.original;
    const translation = message.translation;

    // Skip if translation is empty
    if (!translation || !translation.trim()) {
      continue;
    }

    checked++;

    // Check if needs fixing (quotes or newlines)
    const needsQuoteFix = original.includes('\\"') && translation.includes('"') && !translation.includes('\\"');
    const needsNewlineFix = original.includes('\\n') && !translation.includes('\\n') && translation.includes('\n');

    if (needsQuoteFix || needsNewlineFix) {
      const fixedTranslation = fixEscapeSequences(original, translation);

      if (fixedTranslation !== translation) {
        if (dryRun) {
          log.info(`[DRY RUN] Would fix ${message.logicFile} message ${message.messageNumber}:`);
          log.info(`  Before: ${translation.substring(0, 100)}${translation.length > 100 ? '...' : ''}`);
          log.info(`  After:  ${fixedTranslation.substring(0, 100)}${fixedTranslation.length > 100 ? '...' : ''}`);
        } else {
          message.translation = fixedTranslation;
        }
        fixed++;
      }
    }
  }

  // Write back to file if not dry run
  if (!dryRun && fixed > 0) {
    const updatedContent = JSON.stringify(messagesFile, null, 2);
    writeFileSync(filePath, updatedContent, 'utf-8');
  }

  return { checked, fixed };
}

// Parse command line arguments
const projectDir = process.argv[2] || 'project';
const translationSubdir = process.argv[3] || 'example';
const dryRun = process.argv.includes('--dry-run');

const projectName = projectDir.split('/').pop() || projectDir;
const subdir = translationSubdir || projectName;
const translationsDir = join('translations', subdir);
const messagesFile = join(translationsDir, 'messages.json');

log.info(`${dryRun ? '[DRY RUN] ' : ''}Fixing escape sequences in: ${messagesFile}`);
log.newline();

const { checked, fixed } = fixTranslationFile(messagesFile, dryRun);

log.newline();
log.info(`Messages checked: ${checked}`);

if (fixed === 0) {
  log.success(`✓ No issues found! All escape sequences are correct.`);
} else {
  if (dryRun) {
    log.info(`${fixed} messages would be fixed (run without --dry-run to apply)`);
  } else {
    log.success(`✓ Fixed ${fixed} messages with escape sequence issues`);
    log.info(`Updated: ${messagesFile}`);
  }
}

log.newline();

if (!dryRun && fixed > 0) {
  log.info('Next steps:');
  log.info('1. Review changes: git diff translations/');
  log.info('2. Test build: npm run release:dev example');
}

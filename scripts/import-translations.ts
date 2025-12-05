#!/usr/bin/env node
import { existsSync, mkdirSync, readFileSync, writeFileSync, cpSync, rmSync, readdirSync, renameSync } from 'fs';
import { execSync } from 'child_process';
import { join } from 'path';
import { log } from './utils/logger.js';
import { importObjects } from '../src/translation/import-objects.js';
import { importMessages } from '../src/translation/import-messages.js';
import { importViews } from '../src/translation/import-views.js';
import { applyLogicPatches } from '../src/translation/apply-patches.js';
import {
  generateWordsExtended,
  findDuplicateWords,
  findSkippedPrefixVariants,
} from '../src/translation/generate-words-extended.js';
import type { ObjectsFile, MessagesFile, ViewsFile, VocabularyFile } from '../src/translation/types.js';

/**
 * Import translations from JSON files into game source files
 */
function importTranslations(projectDir: string, translationSubdir?: string): void {
  log.info(`Importing translations for: ${projectDir}`);

  const tmpSrcDir = join(projectDir, 'tmp', 'src');
  const finalDir = join(projectDir, 'final');
  const finalSrcDir = join(finalDir, 'src');
  const projectName = projectDir.split('/').pop() || projectDir;
  const subdir = translationSubdir || projectName;
  const translationsDir = join('translations', subdir);

  // Verify tmp/src exists
  if (!existsSync(tmpSrcDir)) {
    log.error(`Indexed source directory not found: ${tmpSrcDir}`);
    log.error('Run init-translations first: npm run init-translations');
    process.exit(1);
  }

  // Verify translations directory exists
  if (!existsSync(translationsDir)) {
    log.error(`Translations directory not found: ${translationsDir}`);
    log.error('Run extraction first: npm run extract-translations');
    process.exit(1);
  }

  // Create final directory (clean if exists)
  if (existsSync(finalDir)) {
    log.info('Cleaning existing final directory...');
    rmSync(finalDir, { recursive: true, force: true });
  }
  mkdirSync(finalDir, { recursive: true });

  // Copy tmp/src to final/src
  log.info(`Copying ${tmpSrcDir} → ${finalSrcDir}...`);
  cpSync(tmpSrcDir, finalSrcDir, { recursive: true });
  log.success('Source files copied');

  // Apply logic patches (RTL coordinate adjustments)
  log.info('Applying logic patches...');
  const patchStats = applyLogicPatches(translationsDir, finalSrcDir);
  if (patchStats.applied > 0) {
    log.success(`Applied ${patchStats.applied} logic patch(es)`);
  }
  if (patchStats.failed > 0) {
    log.error(`Failed to apply ${patchStats.failed} patch(es)`);
  }

  // Import object translations
  log.info('Importing object translations...');
  const objectsStats = importObjectTranslations(translationsDir, finalSrcDir);

  if (objectsStats.translated > 0) {
    log.success(`Imported ${objectsStats.translated} object translations (${objectsStats.skipped} skipped)`);
  } else {
    log.info('No object translations to import (all translation fields empty)');
  }

  // Import message translations
  log.info('Importing message translations...');
  const messagesStats = importMessageTranslations(translationsDir, finalSrcDir);

  if (messagesStats.translated > 0) {
    log.success(`Imported ${messagesStats.translated} message translations (${messagesStats.skipped} skipped)`);
  } else {
    log.info('No message translations to import (all translation fields empty)');
  }

  // Copy picture resources
  log.info('Copying picture resources...');
  const pictureStats = copyPictureResources(translationsDir, finalSrcDir);
  if (pictureStats.copied > 0 || pictureStats.decompiled > 0) {
    const parts: string[] = [];
    if (pictureStats.copied > 0) parts.push(`${pictureStats.copied} copied`);
    if (pictureStats.decompiled > 0) parts.push(`${pictureStats.decompiled} decompiled`);
    log.success(`Processed ${pictureStats.copied + pictureStats.decompiled} picture resource(s) (${parts.join(', ')})`);
  } else {
    log.info('No picture resources to process');
  }

  // Copy view resources
  log.info('Copying view resources...');
  const viewStats = copyViewResources(translationsDir, finalSrcDir);
  if (viewStats.copied > 0 || viewStats.decompiled > 0) {
    const parts: string[] = [];
    if (viewStats.copied > 0) parts.push(`${viewStats.copied} copied`);
    if (viewStats.decompiled > 0) parts.push(`${viewStats.decompiled} decompiled`);
    log.success(`Processed ${viewStats.copied + viewStats.decompiled} view resource(s) (${parts.join(', ')})`);
  } else {
    log.info('No view resources to process');
  }

  // Import view description translations
  log.info('Importing view description translations...');
  const viewDescStats = importViewDescriptions(translationsDir, finalSrcDir);
  if (viewDescStats.translated > 0) {
    log.success(`Imported ${viewDescStats.translated} view description translation(s) (${viewDescStats.skipped} skipped)`);
  } else {
    log.info('No view description translations to import (all translation fields empty)');
  }

  // Generate WORDS.TOK.EXTENDED for ScummVM runtime
  log.info('Generating WORDS.TOK.EXTENDED...');
  const wordsExtStats = generateWordsExtendedFile(translationsDir, finalDir);
  if (wordsExtStats.generated) {
    log.success(`Generated WORDS.TOK.EXTENDED with ${wordsExtStats.wordCount} words`);
    if (wordsExtStats.skippedCount > 0) {
      log.info(`  (${wordsExtStats.skippedCount} prefix variants skipped due to conflicts - see SKIPPED_PREFIX_VARIANTS.txt)`);
    }
  } else {
    log.info('No vocabulary.json found, skipping WORDS.TOK.EXTENDED generation');
  }

  log.newline();
  log.success('Translation import complete!');
  log.info(`Final source ready in: ${finalSrcDir}`);
  log.info(`To build: agikit build ${finalDir}`);
}

/**
 * Import object translations
 */
function importObjectTranslations(
  translationsDir: string,
  finalSrcDir: string
): { translated: number; skipped: number } {
  const objectsJsonPath = join(translationsDir, 'objects.json');
  const targetObjectPath = join(finalSrcDir, 'object.json');

  // Read translation file
  const translationsContent = readFileSync(objectsJsonPath, 'utf-8');
  const translationsFile: ObjectsFile = JSON.parse(translationsContent);

  // Read target object.json
  const objectJsonContent = readFileSync(targetObjectPath, 'utf-8');

  // Apply translations
  const result = importObjects(objectJsonContent, translationsFile.objects);

  // Write result
  writeFileSync(targetObjectPath, result, 'utf-8');

  // Calculate stats
  const translated = translationsFile.objects.filter(
    obj => obj.translation && obj.translation.trim() !== ''
  ).length;
  const skipped = translationsFile.objects.length - translated;

  return { translated, skipped };
}

/**
 * Import message translations
 */
function importMessageTranslations(
  translationsDir: string,
  finalSrcDir: string
): { translated: number; skipped: number } {
  const messagesJsonPath = join(translationsDir, 'messages.json');
  const logicDir = join(finalSrcDir, 'logic');

  // Read translation file
  const translationsContent = readFileSync(messagesJsonPath, 'utf-8');
  const translationsFile: MessagesFile = JSON.parse(translationsContent);

  // Group messages by logic file
  const messagesByFile = new Map<string, typeof translationsFile.messages>();
  for (const msg of translationsFile.messages) {
    if (!messagesByFile.has(msg.logicFile)) {
      messagesByFile.set(msg.logicFile, []);
    }
    messagesByFile.get(msg.logicFile)!.push(msg);
  }

  let totalTranslated = 0;
  let totalSkipped = 0;

  // Process each logic file
  for (const [logicFileName, messages] of messagesByFile) {
    const logicFilePath = join(logicDir, logicFileName);

    if (!existsSync(logicFilePath)) {
      continue;
    }

    // Read current content
    const logicContent = readFileSync(logicFilePath, 'utf-8');

    // Apply translations
    const updatedContent = importMessages(logicContent, messages);

    // Write back
    writeFileSync(logicFilePath, updatedContent, 'utf-8');

    // Count translations
    const translated = messages.filter(
      msg => msg.translation && msg.translation.trim() !== ''
    ).length;
    totalTranslated += translated;
    totalSkipped += messages.length - translated;
  }

  return { translated: totalTranslated, skipped: totalSkipped };
}

/**
 * Copy picture resources from translations to final/src
 * Handles both .agipic (decompiled) and .agp (compiled WinAGI) formats
 */
function copyPictureResources(
  translationsDir: string,
  finalSrcDir: string
): { copied: number; decompiled: number } {
  const translationsPicDir = join(translationsDir, 'pic');
  const finalPicDir = join(finalSrcDir, 'pic');

  if (!existsSync(translationsPicDir)) {
    return { copied: 0, decompiled: 0 };
  }

  // Create destination directory
  if (!existsSync(finalPicDir)) {
    mkdirSync(finalPicDir, { recursive: true });
  }

  // Regex to match pic files: optional "Pic" or "Picture" prefix, 1-3 digits, .agipic or .agp extension
  const picFilePattern = /^(?:Pic(?:ture)?)?(\d{1,3})\.(agipic|agp)$/i;

  const allFiles = readdirSync(translationsPicDir);
  let copied = 0;
  let decompiled = 0;

  for (const file of allFiles) {
    const match = file.match(picFilePattern);
    if (!match) continue;

    const resourceNumber = match[1];
    const extension = match[2].toLowerCase();
    const srcPath = join(translationsPicDir, file);
    const destPath = join(finalPicDir, `${resourceNumber}.agipic`);

    if (extension === 'agipic') {
      // Direct copy
      cpSync(srcPath, destPath);
      copied++;
    } else if (extension === 'agp') {
      // Decompile first
      execSync(`npx agikit decompile-pic "${srcPath}" "${destPath}"`, { stdio: 'pipe' });
      decompiled++;
    }
  }

  return { copied, decompiled };
}

/**
 * Copy view resources from translations to final/src
 * Handles both .agiview (decompiled) and .agv (compiled WinAGI) formats
 * Also copies accompanying .agiviewdesc files
 */
function copyViewResources(
  translationsDir: string,
  finalSrcDir: string
): { copied: number; decompiled: number } {
  const translationsViewDir = join(translationsDir, 'view');
  const finalViewDir = join(finalSrcDir, 'view');

  if (!existsSync(translationsViewDir)) {
    return { copied: 0, decompiled: 0 };
  }

  // Create destination directory
  if (!existsSync(finalViewDir)) {
    mkdirSync(finalViewDir, { recursive: true });
  }

  // Regex to match view files: optional "View" prefix, 1-3 digits, .agiview or .agv extension
  const viewFilePattern = /^(?:View)?(\d{1,3})\.(agiview|agv)$/i;
  // Regex to match view description files
  const viewDescPattern = /^(?:View)?(\d{1,3})\.agiviewdesc$/i;

  const allFiles = readdirSync(translationsViewDir);
  let copied = 0;
  let decompiled = 0;

  for (const file of allFiles) {
    // Handle view files
    const viewMatch = file.match(viewFilePattern);
    if (viewMatch) {
      const resourceNumber = viewMatch[1];
      const extension = viewMatch[2].toLowerCase();
      const srcPath = join(translationsViewDir, file);
      const destPath = join(finalViewDir, `${resourceNumber}.agiview`);

      if (extension === 'agiview') {
        // Direct copy
        cpSync(srcPath, destPath);
        copied++;
      } else if (extension === 'agv') {
        // Decompile first - outputs to directory, creates {filename}.agiview
        execSync(`npx agikit decompile-view "${srcPath}" "${finalViewDir}"`, { stdio: 'pipe' });
        // Rename if needed (decompile-view uses original filename)
        const decompiledName = file.replace(/\.agv$/i, '.agiview');
        const decompiledPath = join(finalViewDir, decompiledName);
        if (decompiledPath !== destPath && existsSync(decompiledPath)) {
          renameSync(decompiledPath, destPath);
        }
        decompiled++;
      }
      continue;
    }

    // Handle view description files
    const descMatch = file.match(viewDescPattern);
    if (descMatch) {
      const resourceNumber = descMatch[1];
      const srcPath = join(translationsViewDir, file);
      const destPath = join(finalViewDir, `${resourceNumber}.agiviewdesc`);
      cpSync(srcPath, destPath);
    }
  }

  return { copied, decompiled };
}

/**
 * Import view description translations from views.json
 */
function importViewDescriptions(
  translationsDir: string,
  finalSrcDir: string
): { translated: number; skipped: number } {
  const viewsJsonPath = join(translationsDir, 'views.json');
  const viewDir = join(finalSrcDir, 'view');

  // Check if views.json exists
  if (!existsSync(viewsJsonPath)) {
    return { translated: 0, skipped: 0 };
  }

  // Create view directory if it doesn't exist
  if (!existsSync(viewDir)) {
    mkdirSync(viewDir, { recursive: true });
  }

  // Read translation file
  const translationsContent = readFileSync(viewsJsonPath, 'utf-8');
  const translationsFile: ViewsFile = JSON.parse(translationsContent);

  // Apply translations
  return importViews(viewDir, translationsFile.views);
}

/**
 * Generate WORDS.TOK.EXTENDED file for ScummVM runtime
 * This file allows ScummVM to parse player input with extended characters (Hebrew)
 */
function generateWordsExtendedFile(
  translationsDir: string,
  finalDir: string
): { generated: boolean; wordCount: number; skippedCount: number } {
  const vocabJsonPath = join(translationsDir, 'vocabulary.json');
  const outputPath = join(finalDir, 'WORDS.TOK.EXTENDED');
  const skippedLogPath = join(finalDir, 'SKIPPED_PREFIX_VARIANTS.txt');

  // Check if vocabulary.json exists
  if (!existsSync(vocabJsonPath)) {
    return { generated: false, wordCount: 0, skippedCount: 0 };
  }

  // Read vocabulary file
  const vocabContent = readFileSync(vocabJsonPath, 'utf-8');
  const vocabFile: VocabularyFile = JSON.parse(vocabContent);

  // Check for duplicate words before generating
  const duplicates = findDuplicateWords(vocabFile);
  if (duplicates.length > 0) {
    log.error('Duplicate words found in vocabulary! Each word must map to exactly one word number.');
    for (const dup of duplicates) {
      log.error(`  "${dup.word}" appears in:`);
      for (const occ of dup.occurrences) {
        log.error(`    - Word #${occ.wordNumber} (${occ.source})`);
      }
    }
    process.exit(1);
  }

  // Find and log skipped prefix variants
  const skipped = findSkippedPrefixVariants(vocabFile);
  if (skipped.length > 0) {
    const logLines: string[] = [
      'Skipped Prefix Variants Due to Conflicts',
      '=========================================',
      '',
      'These Hebrew prefix variants (ב, ה, ל) were NOT generated because they',
      'conflict with existing words in the vocabulary (Hebrew homographs).',
      '',
      `Total skipped: ${skipped.length}`,
      '',
    ];

    for (const s of skipped) {
      logLines.push(`"${s.variant}" (prefix of "${s.baseSynonym}")`);
      logLines.push(`  Would add to: #${s.sourceWordNumber} (${s.sourceWord})`);
      logLines.push(`  Conflicts with: #${s.conflictWordNumber} (${s.conflictWord})`);
      logLines.push('');
    }

    writeFileSync(skippedLogPath, logLines.join('\n'), 'utf-8');
  }

  // Generate WORDS.TOK.EXTENDED
  const buffer = generateWordsExtended(vocabFile);
  writeFileSync(outputPath, buffer);

  // Count actual words generated (lines in buffer minus header)
  // The buffer is encoded, so we count newlines to get line count
  const content = buffer.toString('latin1'); // Use latin1 to preserve bytes
  const lineCount = content.split('\n').filter((line) => line.length > 0).length;
  const wordCount = lineCount - 1; // Subtract header line

  return { generated: true, wordCount, skippedCount: skipped.length };
}

// Main execution
const projectDir = process.argv[2];
const translationSubdir = process.argv[3]; // Optional

if (!projectDir) {
  log.error('Usage: vite-node scripts/import-translations.ts <project-directory> [translation-subdir]');
  log.error('Example: vite-node scripts/import-translations.ts project');
  log.error('Example: vite-node scripts/import-translations.ts project sq2');
  process.exit(1);
}

importTranslations(projectDir, translationSubdir);

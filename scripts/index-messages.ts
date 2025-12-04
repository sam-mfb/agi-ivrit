import { log } from './utils/logger.js';
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join, relative, dirname } from 'path';
import { findFiles } from './utils/fs-utils.js';
import { parseLogicFile } from '../src/logic/parser.js';
import { indexMessages } from '../src/logic/indexer.js';

// Get directories from command line arguments
const sourceDir = process.argv[2] || 'project/src';
const outputDir = process.argv[3] || sourceDir.replace('/src', '/tmp/src');

log.section('📇 AGI Logic Message Indexer');
log.newline();

// Find all .agilogic files in the source directory
const logicDir = join(sourceDir, 'logic');
const logicFiles = findFiles(logicDir, /\.agilogic$/);

if (logicFiles.length === 0) {
  log.error(`No .agilogic files found in ${logicDir}`);
  process.exit(1);
}

log.info(`Source: ${sourceDir}`);
log.info(`Output: ${outputDir}`);
log.info(`Found ${logicFiles.length} logic file(s)`);
log.newline();

// Process each file
let totalFilesProcessed = 0;
let totalReplacedStrings = 0;
let totalNewMessages = 0;

for (const filePath of logicFiles) {
  const relativePath = relative(sourceDir, filePath);
  log.step(`Processing ${relativePath}...`);

  try {
    // Read and parse the file
    const content = readFileSync(filePath, 'utf-8');
    const logicFile = parseLogicFile(content);

    // Index messages
    const result = indexMessages(logicFile);

    // Determine output file path
    const outputPath = join(outputDir, relativePath);
    const outputDirPath = dirname(outputPath);

    // Create output directory if it doesn't exist
    mkdirSync(outputDirPath, { recursive: true });

    // Write the transformed content to output
    writeFileSync(outputPath, result.content, 'utf-8');

    // Update statistics
    totalFilesProcessed++;
    totalReplacedStrings += result.stats.replacedStrings;
    totalNewMessages += result.stats.newMessagesAdded;

    // Report file statistics
    if (result.stats.replacedStrings > 0 || result.stats.newMessagesAdded > 0) {
      log.info(`  ✓ ${result.stats.replacedStrings} matched, ${result.stats.newMessagesAdded} new messages added`);
    } else {
      log.info(`  → No changes needed`);
    }
  } catch (error) {
    log.error(`  Failed to process ${relativePath}: ${error}`);
    process.exit(1);
  }
}

log.newline();
log.emoji('✅', 'Message indexing complete!');
log.newline();
log.info(`Processed ${totalFilesProcessed} file(s)`);
log.info(`Total hardcoded strings replaced: ${totalReplacedStrings}`);
log.info(`Total new messages added: ${totalNewMessages}`);
log.info(`Output written to: ${outputDir}`);

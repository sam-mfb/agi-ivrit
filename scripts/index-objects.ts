import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join, dirname, relative } from 'path';
import { log } from './utils/logger.js';
import { findFiles } from './utils/fs-utils.js';
import { parseObjectFile } from '../src/logic/object-parser.js';
import { indexObjects } from '../src/logic/object-indexer.js';

// Usage: vite-node scripts/index-objects.ts [sourceDir] [outputDir]
// Example: vite-node scripts/index-objects.ts project/src
// Example: vite-node scripts/index-objects.ts example/src example/tmp/src

const sourceDir = process.argv[2] || 'project/src';
const outputDir = process.argv[3] || sourceDir.replace('/src', '/tmp/src');

log.emoji('🔧', 'Indexing inventory objects in logic files...');
log.newline();

// Read and parse object.json
const objectJsonPath = join(sourceDir, 'object.json');
try {
  const objectContent = readFileSync(objectJsonPath, 'utf-8');
  const objectFile = parseObjectFile(objectContent);

  log.step(`Found ${objectFile.objects.length} inventory objects`);
  log.newline();

  // Process all logic files
  const logicDir = join(sourceDir, 'logic');
  const logicFiles = findFiles(logicDir, /\.agilogic$/);

  log.step(`Processing ${logicFiles.length} logic files...`);
  log.newline();

  let totalReplacedObjects = 0;

  for (const filePath of logicFiles) {
    const content = readFileSync(filePath, 'utf-8');
    const result = indexObjects(content, objectFile.objects);

    // Create output path
    const relativePath = relative(sourceDir, filePath);
    const outputPath = join(outputDir, relativePath);

    // Ensure output directory exists
    mkdirSync(dirname(outputPath), { recursive: true });

    // Write transformed file
    writeFileSync(outputPath, result.content, 'utf-8');

    totalReplacedObjects += result.stats.replacedObjects;

    if (result.stats.replacedObjects > 0) {
      log.step(`${relativePath}: ${result.stats.replacedObjects} object(s) indexed`);
    }
  }

  log.newline();
  log.emoji('✅', `Complete!`);
  log.step(`Total files processed: ${logicFiles.length}`);
  log.step(`Total objects indexed: ${totalReplacedObjects}`);
  log.step(`Output directory: ${outputDir}`);
  log.newline();

} catch (error) {
  if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
    log.error(`Could not find object.json at ${objectJsonPath}`);
    log.info('Make sure you have run setup first (npm run setup)');
  } else {
    log.error(`Error: ${(error as Error).message}`);
  }
  process.exit(1);
}

import { log } from './utils/logger.js';
import { exec } from './utils/exec-utils.js';
import { existsSync, cpSync, rmSync, mkdirSync } from 'fs';
import { join } from 'path';

// Usage: vite-node scripts/index-all.ts <directory>
// Example: vite-node scripts/index-all.ts project
// Example: vite-node scripts/index-all.ts example

const dir = process.argv[2];

if (!dir) {
  log.error('No directory specified');
  log.info('Usage: vite-node scripts/index-all.ts <directory>');
  log.info('Example: vite-node scripts/index-all.ts project');
  process.exit(1);
}

// Verify directory exists
if (!existsSync(dir)) {
  log.error(`Directory does not exist: ${dir}`);
  process.exit(1);
}

// Verify src directory exists
const srcDir = join(dir, 'src');
if (!existsSync(srcDir)) {
  log.error(`Source directory does not exist: ${srcDir}`);
  log.info('Run init-translations first: npm run init-translations');
  process.exit(1);
}

log.section('🔧 AGI Translation Indexer');
log.newline();
log.info(`Processing ${dir}/ directory...`);
log.newline();

// Step 0: Copy src to tmp/src
const tmpSrcDir = join(dir, 'tmp', 'src');
log.step('Step 1/3: Copying src/ to tmp/src/...');

// Remove existing tmp/src if it exists
if (existsSync(tmpSrcDir)) {
  rmSync(tmpSrcDir, { recursive: true, force: true });
}

// Create tmp directory if needed
const tmpDir = join(dir, 'tmp');
if (!existsSync(tmpDir)) {
  mkdirSync(tmpDir, { recursive: true });
}

// Copy src to tmp/src
cpSync(srcDir, tmpSrcDir, { recursive: true });
log.info(`✓ Copied ${srcDir} to ${tmpSrcDir}`);

// Copy agikit-project.json to tmp/
const agikitProjectSrc = join(dir, 'agikit-project.json');
const agikitProjectDest = join(tmpDir, 'agikit-project.json');
if (existsSync(agikitProjectSrc)) {
  cpSync(agikitProjectSrc, agikitProjectDest);
  log.info(`✓ Copied agikit-project.json to ${tmpDir}`);
}
log.newline();

// Step 1: Object indexing (now runs on tmp/src, overwrites in place)
log.step('Step 2/3: Indexing inventory objects...');
log.newline();
exec(`vite-node scripts/index-objects.ts ${dir}/tmp/src ${dir}/tmp/src`);

log.newline();

// Step 2: Message indexing
log.step('Step 3/3: Indexing messages...');
log.newline();
exec(`vite-node scripts/index-messages.ts ${dir}/tmp/src ${dir}/tmp/src`);

log.newline();
log.emoji('✅', 'Indexing complete!');
log.newline();
log.info(`Indexed files are in ${dir}/tmp/src/`);
log.info('These files are ready for translation.');
log.newline();

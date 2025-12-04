import { log } from './utils/logger.js';
import { removeDir, removeFile, exists } from './utils/fs-utils.js';

// Usage: vite-node scripts/clean-agi.ts <directory> [--keep-orig]
// Example: vite-node scripts/clean-agi.ts project
// Example: vite-node scripts/clean-agi.ts example --keep-orig

const dir = process.argv[2];
const keepOrig = process.argv.includes('--keep-orig');

if (!dir) {
  log.error('No directory specified');
  log.info('Usage: vite-node scripts/clean-agi.ts <directory> [--keep-orig]');
  process.exit(1);
}

log.emoji('🧹', `Cleaning ${dir} directory...`);
log.newline();

// Remove extracted directories
if (!keepOrig && exists(`${dir}/orig`)) {
  log.step(`Removing ${dir}/orig/...`);
  removeDir(`${dir}/orig`);
}

if (exists(`${dir}/src`)) {
  log.step(`Removing ${dir}/src/...`);
  removeDir(`${dir}/src`);
}

if (exists(`${dir}/build`)) {
  log.step(`Removing ${dir}/build/...`);
  removeDir(`${dir}/build`);
}

// Remove tmp directory
if (exists(`${dir}/tmp`)) {
  log.step(`Removing ${dir}/tmp/...`);
  removeDir(`${dir}/tmp`);
}

// Remove agikit-project.json
if (exists(`${dir}/agikit-project.json`)) {
  log.step(`Removing ${dir}/agikit-project.json...`);
  removeFile(`${dir}/agikit-project.json`);
}

// Remove viewer resources
if (exists('viewer/public/resources')) {
  log.step('Removing viewer/public/resources/...');
  removeDir('viewer/public/resources');
}

log.newline();

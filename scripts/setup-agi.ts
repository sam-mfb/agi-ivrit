import { log } from './utils/logger.js';
import { exists, ensureDir } from './utils/fs-utils.js';
import { exec } from './utils/exec-utils.js';

// Usage: vite-node scripts/setup-agi.ts <directory>
// Example: vite-node scripts/setup-agi.ts project
// Example: vite-node scripts/setup-agi.ts example

const dir = process.argv[2];

if (!dir) {
  log.error('No directory specified');
  log.info('Usage: vite-node scripts/setup-agi.ts <directory>');
  process.exit(1);
}

if (!exists(dir)) {
  log.error(`${dir}/ directory not found`);
  process.exit(1);
}

if (!exists(`${dir}/orig`)) {
  log.error(`${dir}/orig/ directory not found`);
  log.info(`Please ensure ${dir}/orig/ contains AGI game files`);
  process.exit(1);
}

log.emoji('🔧', 'Extracting AGI resources with agikit...');
exec(`npx agikit extract ${dir}/orig/ ${dir}/`);

if (!exists(`${dir}/src`)) {
  log.error(`agikit extraction failed - ${dir}/src not created`);
  process.exit(1);
}

log.success(`Extracted resources to ${dir}/src/`);
log.newline();

// Create build directory
log.emoji('📁', 'Creating build directory...');
ensureDir(`${dir}/build`);
log.success(`Created ${dir}/build/`);
log.newline();

import { log } from './utils/logger.js';
import { exec } from './utils/exec-utils.js';

log.emoji('🧹', 'Cleaning project directory...');
log.newline();

// Run common AGI cleanup (keeps orig/ with --keep-orig flag)
// Note: ZIP files are preserved - they're the user's game files
exec('vite-node scripts/clean-agi.ts project --keep-orig');

log.emoji('✅', 'Cleanup complete!');
log.newline();
log.info('The project/ directory has been cleaned.');
log.info('ZIP files and orig/ directory have been preserved.');
log.info("Run 'npm run setup' to re-extract resources.");

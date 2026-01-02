#!/usr/bin/env node
import { execSync } from 'child_process';
import { existsSync, readdirSync, readFileSync, writeFileSync, rmSync } from 'fs';
import { join } from 'path';
import { log } from './utils/logger.js';

/**
 * Full release workflow
 * - Checks GitHub CLI is authenticated
 * - Increments version in translations.json
 * - Builds patches and patcher executables
 * - Creates a GitHub release with patchers as assets
 */

const translationSubdir = process.argv[2];

if (!translationSubdir) {
  log.error('Usage: vite-node scripts/release.ts <translation-subdir>');
  log.error('Example: vite-node scripts/release.ts sq1');
  process.exit(1);
}

interface TranslationConfig {
  name: string;
  repo: string;
  version: number;
}

interface TranslationsFile {
  translations: Record<string, TranslationConfig>;
}

const PATCHERS_DIR = 'project/patchers';

/**
 * Check if GitHub CLI is installed and authenticated
 */
function checkGitHubAuth(): boolean {
  try {
    execSync('gh auth status', { stdio: 'pipe' });
    return true;
  } catch {
    return false;
  }
}

/**
 * Load translation configuration
 */
function loadTranslationConfig(subdir: string): TranslationConfig {
  const translationsPath = 'translations.json';
  if (!existsSync(translationsPath)) {
    throw new Error('translations.json not found');
  }

  const content = readFileSync(translationsPath, 'utf-8');
  const data: TranslationsFile = JSON.parse(content);

  const config = data.translations[subdir];
  if (!config) {
    throw new Error(
      `Translation "${subdir}" not found in translations.json. Available: ${Object.keys(data.translations).join(', ')}`
    );
  }

  return config;
}

async function main() {
  // Step 1: Check GitHub CLI authentication
  log.section('Checking GitHub CLI');
  if (!checkGitHubAuth()) {
    log.error('GitHub CLI (gh) is not installed or not authenticated.');
    log.error('Please install gh and run "gh auth login" first.');
    log.error('See: https://cli.github.com/');
    process.exit(1);
  }
  log.success('GitHub CLI is authenticated');

  // Step 2: Load translation config
  log.section('Loading translation configuration');
  let config: TranslationConfig;
  try {
    config = loadTranslationConfig(translationSubdir);
    log.info(`Game: ${config.name}`);
    log.info(`Repository: ${config.repo}`);
    log.success('Configuration loaded');
  } catch (error) {
    log.error(`Failed to load configuration: ${error instanceof Error ? error.message : error}`);
    process.exit(1);
  }

  // Step 3: Increment and save version
  log.section('Updating version');
  const newVersion = config.version + 1;
  log.info(`Version: ${config.version} → ${newVersion}`);

  const translationsPath = 'translations.json';
  const translationsContent = readFileSync(translationsPath, 'utf-8');
  const translationsData: TranslationsFile = JSON.parse(translationsContent);
  translationsData.translations[translationSubdir].version = newVersion;
  writeFileSync(translationsPath, JSON.stringify(translationsData, null, 2) + '\n');
  log.success('Version updated in translations.json');

  const versionTag = `v${newVersion}`; // For GitHub release tag

  // Step 4: Run release-patch workflow
  log.section('Building patches');
  try {
    execSync(`vite-node scripts/release-patch.ts ${translationSubdir} ${newVersion}`, { stdio: 'inherit' });
    log.success('Patches built');
  } catch (error) {
    log.error('Failed to build patches');
    process.exit(1);
  }

  // Step 5: Verify patchers exist
  log.section('Verifying patcher executables');
  if (!existsSync(PATCHERS_DIR)) {
    log.error(`Patchers directory not found: ${PATCHERS_DIR}`);
    process.exit(1);
  }

  let patchers = readdirSync(PATCHERS_DIR).filter((f) =>
    f.startsWith(`${translationSubdir}-heb`)
  );

  if (patchers.length === 0) {
    log.error('No patcher executables found');
    process.exit(1);
  }

  log.info(`Found ${patchers.length} patcher executables:`);
  for (const patcher of patchers) {
    log.step(patcher);
  }
  log.success('Patchers verified');

  // Step 6: Zip .app directories for GitHub release
  log.section('Preparing patchers for upload');
  for (const patcher of patchers) {
    if (patcher.endsWith('.app')) {
      const appPath = join(PATCHERS_DIR, patcher);
      const zipPath = `${appPath}.zip`;
      log.info(`Zipping ${patcher}...`);
      execSync(`zip -r "${zipPath}" "${patcher}"`, { cwd: PATCHERS_DIR, stdio: 'inherit' });
      rmSync(appPath, { recursive: true, force: true });
      log.success(`Created ${patcher}.zip`);
    }
  }
  // Re-read patchers list to get .zip files instead of .app directories
  patchers = readdirSync(PATCHERS_DIR).filter((f) =>
    f.startsWith(`${translationSubdir}-heb`)
  );

  // Step 7: Create GitHub release
  log.section('Creating GitHub release');
  const releaseTitle = `${config.name} Hebrew Translation ${versionTag}`;
  const releaseNotes = `Hebrew translation patch for ${config.name}.\n\nDownload the appropriate patcher for your platform and run it on your original game directory.`;

  const patcherPaths = patchers.map((p) => join(PATCHERS_DIR, p)).join(' ');

  const ghCommand = [
    'gh',
    'release',
    'create',
    versionTag,
    '--repo',
    config.repo,
    '--title',
    `"${releaseTitle}"`,
    '--notes',
    `"${releaseNotes}"`,
    patcherPaths
  ].join(' ');

  log.info(`Creating release ${versionTag} in ${config.repo}...`);
  try {
    execSync(ghCommand, { stdio: 'inherit' });
    log.success('GitHub release created!');
  } catch (error) {
    log.error('Failed to create GitHub release');
    process.exit(1);
  }

  log.newline();
  log.success('Release complete!');
  log.info(`View at: ${config.repo}/releases/tag/${versionTag}`);
}

main().catch((error) => {
  log.error(`Unexpected error: ${error instanceof Error ? error.message : error}`);
  process.exit(1);
});

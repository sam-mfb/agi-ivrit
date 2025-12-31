/**
 * Graft binary management utilities
 * Downloads and manages the graft binary for patch creation
 */

import { existsSync, mkdirSync, chmodSync, createWriteStream } from 'fs';
import { join } from 'path';
import { execSync } from 'child_process';
import { log } from './logger.js';
import https from 'https';

const GRAFT_CACHE_DIR = 'project/.graft';
const GRAFT_RELEASE_URL = 'https://github.com/sam-mfb/graft/releases/latest/download';

type Platform = 'linux' | 'macos' | 'windows';
type Arch = 'x64' | 'arm64';

interface PlatformInfo {
  platform: Platform;
  arch: Arch;
  binaryName: string;
}

/**
 * Detect the current platform and architecture
 */
function detectPlatform(): PlatformInfo {
  const nodePlatform = process.platform;
  const nodeArch = process.arch;

  let platform: Platform;
  if (nodePlatform === 'linux') {
    platform = 'linux';
  } else if (nodePlatform === 'darwin') {
    platform = 'macos';
  } else if (nodePlatform === 'win32') {
    platform = 'windows';
  } else {
    throw new Error(`Unsupported platform: ${nodePlatform}`);
  }

  let arch: Arch;
  if (nodeArch === 'x64') {
    arch = 'x64';
  } else if (nodeArch === 'arm64') {
    arch = 'arm64';
  } else {
    throw new Error(`Unsupported architecture: ${nodeArch}`);
  }

  const ext = platform === 'windows' ? '.exe' : '';
  const binaryName = `graft-${platform}-${arch}${ext}`;

  return { platform, arch, binaryName };
}

/**
 * Download a file from a URL
 */
function downloadFile(url: string, dest: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const file = createWriteStream(dest);

    const request = (currentUrl: string) => {
      https
        .get(currentUrl, (response) => {
          // Handle redirects
          if (
            response.statusCode &&
            response.statusCode >= 300 &&
            response.statusCode < 400 &&
            response.headers.location
          ) {
            request(response.headers.location);
            return;
          }

          if (response.statusCode !== 200) {
            reject(new Error(`Failed to download: HTTP ${response.statusCode}`));
            return;
          }

          response.pipe(file);
          file.on('finish', () => {
            file.close();
            resolve();
          });
        })
        .on('error', (err) => {
          reject(err);
        });
    };

    request(url);
  });
}

/**
 * Ensure graft binary is available, downloading if necessary
 * Returns the path to the graft binary
 */
export async function ensureGraft(): Promise<string> {
  const { platform, binaryName } = detectPlatform();
  const cacheDir = GRAFT_CACHE_DIR;
  const binaryPath = join(cacheDir, binaryName);

  // Check if already cached
  if (existsSync(binaryPath)) {
    log.info(`Using cached graft binary: ${binaryPath}`);
    return binaryPath;
  }

  // Create cache directory
  if (!existsSync(cacheDir)) {
    mkdirSync(cacheDir, { recursive: true });
  }

  // Download binary
  const downloadUrl = `${GRAFT_RELEASE_URL}/${binaryName}`;
  log.info(`Downloading graft binary from ${downloadUrl}...`);

  try {
    await downloadFile(downloadUrl, binaryPath);
    log.success(`Downloaded graft binary to ${binaryPath}`);
  } catch (error) {
    throw new Error(
      `Failed to download graft binary: ${error instanceof Error ? error.message : error}`
    );
  }

  // Make executable on Unix
  if (platform !== 'windows') {
    chmodSync(binaryPath, 0o755);
    log.info('Made graft binary executable');
  }

  return binaryPath;
}

/**
 * Run a graft command with the given arguments
 */
export function runGraft(graftPath: string, args: string[]): void {
  const command = `"${graftPath}" ${args.join(' ')}`;
  log.info(`Running: graft ${args.join(' ')}`);
  execSync(command, { stdio: 'inherit' });
}

/**
 * All target platforms for patcher creation
 */
export const PATCHER_TARGETS = [
  { target: 'linux-x64', suffix: '-linux-x64' },
  { target: 'linux-arm64', suffix: '-linux-arm64' },
  { target: 'darwin-x64', suffix: '-macos-x64' },
  { target: 'darwin-arm64', suffix: '-macos-arm64' },
  { target: 'windows-x64', suffix: '-windows-x64.exe' },
] as const;

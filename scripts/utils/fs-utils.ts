/**
 * File system utilities for cross-platform operations
 */

import fs from 'fs';
import path from 'path';

/**
 * Remove directory recursively (like rm -rf)
 */
export function removeDir(dirPath: string): void {
  if (fs.existsSync(dirPath)) {
    fs.rmSync(dirPath, { recursive: true, force: true });
  }
}

/**
 * Remove file (like rm -f)
 */
export function removeFile(filePath: string): void {
  if (fs.existsSync(filePath)) {
    fs.rmSync(filePath, { force: true });
  }
}

/**
 * Create directory recursively (like mkdir -p)
 */
export function ensureDir(dirPath: string): void {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

/**
 * Copy directory recursively (like cp -r)
 */
export function copyDir(src: string, dest: string): void {
  ensureDir(dest);
  fs.cpSync(src, dest, { recursive: true });
}

/**
 * Check if path exists
 */
export function exists(filePath: string): boolean {
  return fs.existsSync(filePath);
}

/**
 * Check if path is a directory
 */
export function isDirectory(filePath: string): boolean {
  try {
    return fs.statSync(filePath).isDirectory();
  } catch {
    return false;
  }
}

/**
 * Find files matching pattern in directory (non-recursive)
 */
export function findFiles(dir: string, pattern: RegExp): string[] {
  if (!exists(dir) || !isDirectory(dir)) {
    return [];
  }

  return fs.readdirSync(dir)
    .filter(file => pattern.test(file))
    .map(file => path.join(dir, file));
}

/**
 * Check if directory is empty
 */
export function isEmptyDir(dirPath: string): boolean {
  if (!exists(dirPath) || !isDirectory(dirPath)) {
    return true;
  }
  return fs.readdirSync(dirPath).length === 0;
}

/**
 * Move/rename file or directory
 */
export function move(oldPath: string, newPath: string): void {
  fs.renameSync(oldPath, newPath);
}

/**
 * Get list of items in directory
 */
export function readDir(dirPath: string): string[] {
  if (!exists(dirPath) || !isDirectory(dirPath)) {
    return [];
  }
  return fs.readdirSync(dirPath);
}

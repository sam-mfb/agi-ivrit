/**
 * Command execution utilities
 */

import { execSync, ExecSyncOptions } from 'child_process';

/**
 * Execute a shell command and inherit stdio (shows output in real-time)
 */
export function exec(command: string, options?: ExecSyncOptions): void {
  execSync(command, {
    stdio: 'inherit',
    ...options,
  });
}

/**
 * Execute a shell command and return output as string
 */
export function execOutput(command: string, options?: ExecSyncOptions): string {
  const result = execSync(command, {
    encoding: 'utf-8',
    ...options,
  });
  return result.toString().trim();
}

/**
 * Execute a command silently (no output)
 */
export function execSilent(command: string, options?: ExecSyncOptions): void {
  execSync(command, {
    stdio: 'ignore',
    ...options,
  });
}

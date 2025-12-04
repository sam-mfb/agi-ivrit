import { execSync } from 'child_process';
import { existsSync, readdirSync } from 'fs';
import { join, resolve } from 'path';

/**
 * Apply logic file patches for RTL coordinate adjustments
 *
 * Looks for .patch files in translationsDir/logic/ and applies them
 * to the corresponding files in finalSrcDir/logic/
 *
 * @param translationsDir - Directory containing translation files (e.g., translations/sq2)
 * @param finalSrcDir - Directory containing final source files (e.g., project/final/src)
 * @returns Statistics about patches applied
 */
export function applyLogicPatches(
  translationsDir: string,
  finalSrcDir: string
): { applied: number; failed: number } {
  const logicPatchesDir = join(translationsDir, 'logic');

  if (!existsSync(logicPatchesDir)) {
    return { applied: 0, failed: 0 };
  }

  const patchFiles = readdirSync(logicPatchesDir)
    .filter(f => f.endsWith('.patch'));

  if (patchFiles.length === 0) {
    return { applied: 0, failed: 0 };
  }

  let applied = 0;
  let failed = 0;

  for (const patchFile of patchFiles) {
    // Use absolute path for patch file
    const patchPath = resolve(join(logicPatchesDir, patchFile));
    // Use relative path for target file (relative to cwd=finalSrcDir)
    const targetFile = patchFile.replace('.patch', '');
    const targetPath = join('logic', targetFile);
    const targetPathAbs = join(finalSrcDir, 'logic', targetFile);

    if (!existsSync(targetPathAbs)) {
      // Target file doesn't exist, skip this patch
      failed++;
      continue;
    }

    try {
      // Use -p3 to strip 'project/tmp/src/' from patch paths
      // Patch header: project/tmp/src/logic/1.agilogic -> logic/1.agilogic
      execSync(`patch -p3 -i "${patchPath}" "${targetPath}"`, {
        cwd: finalSrcDir,
        stdio: 'pipe'
      });
      applied++;
    } catch (error) {
      failed++;
    }
  }

  return { applied, failed };
}

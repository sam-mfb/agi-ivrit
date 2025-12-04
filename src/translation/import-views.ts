import { existsSync, writeFileSync } from 'fs';
import { join } from 'path';
import type { TranslationView } from './types.js';

/**
 * Apply view description translations to .agiviewdesc files
 * Only writes translations for views that have non-empty translation strings
 *
 * @param viewDir - The view directory (e.g., final/src/view)
 * @param translations - Array of view translations
 * @returns Statistics about the import
 */
export function importViews(
  viewDir: string,
  translations: TranslationView[]
): { translated: number; skipped: number } {
  let translated = 0;
  let skipped = 0;

  for (const view of translations) {
    const descFile = join(viewDir, `${view.viewNumber}.agiviewdesc`);

    // Only write if we have a non-empty translation
    if (view.translation && view.translation.trim() !== '') {
      // Write the translation (even if original file doesn't exist)
      writeFileSync(descFile, view.translation, 'utf-8');
      translated++;
    } else {
      skipped++;
    }
  }

  return { translated, skipped };
}

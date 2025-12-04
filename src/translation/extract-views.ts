import { readdirSync, readFileSync } from 'fs';
import { join } from 'path';
import type { TranslationView } from './types.js';

/**
 * Extract translatable view descriptions from .agiviewdesc files
 * These files contain inventory item description text embedded in VIEW resources
 */
export function extractViews(viewDir: string): TranslationView[] {
  const views: TranslationView[] = [];

  // Find all .agiviewdesc files
  const files = readdirSync(viewDir)
    .filter(f => f.endsWith('.agiviewdesc'))
    .sort((a, b) => {
      const aNum = parseInt(a.replace('.agiviewdesc', ''), 10);
      const bNum = parseInt(b.replace('.agiviewdesc', ''), 10);
      return aNum - bNum;
    });

  for (const file of files) {
    const viewNumber = parseInt(file.replace('.agiviewdesc', ''), 10);
    const content = readFileSync(join(viewDir, file), 'utf-8');

    views.push({
      viewNumber,
      original: content.trim(),
      translation: '',
      notes: ''
    });
  }

  return views;
}

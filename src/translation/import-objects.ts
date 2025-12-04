import type { TranslationObject } from './types.js';

/**
 * Apply object translations to object.json content
 * Only replaces objects that have non-empty translation strings
 */
export function importObjects(
  objectJsonContent: string,
  translations: TranslationObject[]
): string {
  const parsed = JSON.parse(objectJsonContent);

  // Build a map of index to translation for quick lookup
  const translationMap = new Map<number, string>();
  for (const trans of translations) {
    // Only include translations with non-empty strings
    if (trans.translation && trans.translation.trim() !== '') {
      translationMap.set(trans.index, trans.translation);
    }
  }

  // Apply translations to objects
  for (let i = 0; i < parsed.objects.length; i++) {
    if (translationMap.has(i)) {
      parsed.objects[i].name = translationMap.get(i);
    }
  }

  // Return formatted JSON
  return JSON.stringify(parsed, null, 2);
}

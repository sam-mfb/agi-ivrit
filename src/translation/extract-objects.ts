import type { TranslationObject } from './types.js';
import { parseObjectFile } from '../logic/object-parser.js';

/**
 * Extract translatable objects from object.json content
 */
export function extractObjects(objectJsonContent: string): TranslationObject[] {
  const objectFile = parseObjectFile(objectJsonContent);
  const objects: TranslationObject[] = [];

  // Parse the JSON again to get all objects with indices
  const parsed = JSON.parse(objectJsonContent);

  for (let index = 0; index < parsed.objects.length; index++) {
    const obj = parsed.objects[index];

    // Skip placeholder objects
    if (obj.name === '?') {
      continue;
    }

    objects.push({
      index,
      original: obj.name,
      translation: '',
      startingRoom: obj.startingRoomNumber,
      notes: ''
    });
  }

  return objects;
}

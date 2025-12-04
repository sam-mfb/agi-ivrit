import { ObjectFile, InventoryObject } from './object-types.js';

export function parseObjectFile(content: string): ObjectFile {
  const parsed = JSON.parse(content);

  const objects: InventoryObject[] = parsed.objects
    .map((obj: any, index: number) => ({
      index,
      name: obj.name
    }))
    .filter((obj: InventoryObject) => obj.name !== '?');

  return {
    maxAnimatedObjects: parsed.maxAnimatedObjects,
    objects
  };
}

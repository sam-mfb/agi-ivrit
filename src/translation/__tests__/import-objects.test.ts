import { describe, it, expect } from 'vitest';
import { importObjects } from '../import-objects.js';
import type { TranslationObject } from '../types.js';

describe('importObjects', () => {
  it('should apply translations to object.json', () => {
    const objectJson = `{
  "maxAnimatedObjects": 16,
  "objects": [
    { "name": "?", "startingRoomNumber": 0 },
    { "name": "Rock", "startingRoomNumber": 0 },
    { "name": "Key", "startingRoomNumber": 255 }
  ]
}`;

    const translations: TranslationObject[] = [
      {
        index: 1,
        original: 'Rock',
        translation: 'אבן',
        startingRoom: 0,
        notes: ''
      },
      {
        index: 2,
        original: 'Key',
        translation: 'מפתח',
        startingRoom: 255,
        notes: ''
      }
    ];

    const result = importObjects(objectJson, translations);
    const parsed = JSON.parse(result);

    expect(parsed.objects[1].name).toBe('אבן');
    expect(parsed.objects[2].name).toBe('מפתח');
    expect(parsed.objects[0].name).toBe('?'); // Unchanged
  });

  it('should skip objects with empty translation strings', () => {
    const objectJson = `{
  "maxAnimatedObjects": 16,
  "objects": [
    { "name": "Rock", "startingRoomNumber": 0 },
    { "name": "Key", "startingRoomNumber": 255 }
  ]
}`;

    const translations: TranslationObject[] = [
      {
        index: 0,
        original: 'Rock',
        translation: '',  // Empty - should skip
        startingRoom: 0,
        notes: ''
      },
      {
        index: 1,
        original: 'Key',
        translation: 'מפתח',
        startingRoom: 255,
        notes: ''
      }
    ];

    const result = importObjects(objectJson, translations);
    const parsed = JSON.parse(result);

    expect(parsed.objects[0].name).toBe('Rock');  // Unchanged
    expect(parsed.objects[1].name).toBe('מפתח'); // Translated
  });

  it('should preserve object.json structure and metadata', () => {
    const objectJson = `{
  "maxAnimatedObjects": 20,
  "objects": [
    { "name": "Item", "startingRoomNumber": 5 }
  ]
}`;

    const translations: TranslationObject[] = [
      {
        index: 0,
        original: 'Item',
        translation: 'פריט',
        startingRoom: 5,
        notes: ''
      }
    ];

    const result = importObjects(objectJson, translations);
    const parsed = JSON.parse(result);

    expect(parsed.maxAnimatedObjects).toBe(20);
    expect(parsed.objects[0].startingRoomNumber).toBe(5);
  });

  it('should handle no translations (all empty strings)', () => {
    const objectJson = `{
  "maxAnimatedObjects": 16,
  "objects": [
    { "name": "Rock", "startingRoomNumber": 0 },
    { "name": "Key", "startingRoomNumber": 255 }
  ]
}`;

    const translations: TranslationObject[] = [
      {
        index: 0,
        original: 'Rock',
        translation: '',
        startingRoom: 0,
        notes: ''
      },
      {
        index: 1,
        original: 'Key',
        translation: '',
        startingRoom: 255,
        notes: ''
      }
    ];

    const result = importObjects(objectJson, translations);
    const parsed = JSON.parse(result);

    // Nothing should change
    expect(parsed.objects[0].name).toBe('Rock');
    expect(parsed.objects[1].name).toBe('Key');
  });

  it('should handle partial translations', () => {
    const objectJson = `{
  "maxAnimatedObjects": 16,
  "objects": [
    { "name": "Rock", "startingRoomNumber": 0 },
    { "name": "Key", "startingRoomNumber": 255 },
    { "name": "Sword", "startingRoomNumber": 10 }
  ]
}`;

    const translations: TranslationObject[] = [
      {
        index: 0,
        original: 'Rock',
        translation: 'אבן',
        startingRoom: 0,
        notes: ''
      },
      {
        index: 1,
        original: 'Key',
        translation: '',  // Not translated yet
        startingRoom: 255,
        notes: ''
      },
      {
        index: 2,
        original: 'Sword',
        translation: 'חרב',
        startingRoom: 10,
        notes: ''
      }
    ];

    const result = importObjects(objectJson, translations);
    const parsed = JSON.parse(result);

    expect(parsed.objects[0].name).toBe('אבן');   // Translated
    expect(parsed.objects[1].name).toBe('Key');   // Original (not translated)
    expect(parsed.objects[2].name).toBe('חרב');   // Translated
  });

  it('should return statistics about translations applied', () => {
    const objectJson = `{
  "maxAnimatedObjects": 16,
  "objects": [
    { "name": "Rock", "startingRoomNumber": 0 },
    { "name": "Key", "startingRoomNumber": 255 },
    { "name": "Sword", "startingRoomNumber": 10 }
  ]
}`;

    const translations: TranslationObject[] = [
      {
        index: 0,
        original: 'Rock',
        translation: 'אבן',
        startingRoom: 0,
        notes: ''
      },
      {
        index: 1,
        original: 'Key',
        translation: '',
        startingRoom: 255,
        notes: ''
      },
      {
        index: 2,
        original: 'Sword',
        translation: 'חרב',
        startingRoom: 10,
        notes: ''
      }
    ];

    const result = importObjects(objectJson, translations);

    // For now, just verify it returns valid JSON
    // We'll add stats return value in implementation
    expect(() => JSON.parse(result)).not.toThrow();
  });
});

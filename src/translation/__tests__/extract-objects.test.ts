import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import { extractObjects } from '../extract-objects.js';

const FIXTURES_DIR = join(__dirname, '../../logic/__tests__/fixtures');

describe('extractObjects', () => {
  it('should extract objects from object.json', () => {
    const content = readFileSync(join(FIXTURES_DIR, 'test-object.json'), 'utf-8');
    const result = extractObjects(content);

    // Fixture has: ?, Rock, Key, ?, Flashlight
    // Should extract only non-? objects with correct indices
    expect(result).toHaveLength(3);

    expect(result[0]).toEqual({
      index: 1,
      original: 'Rock',
      translation: '',
      startingRoom: 0,
      notes: ''
    });

    expect(result[1]).toEqual({
      index: 2,
      original: 'Key',
      translation: '',
      startingRoom: 255,
      notes: ''
    });

    expect(result[2]).toEqual({
      index: 4,
      original: 'Flashlight',
      translation: '',
      startingRoom: 0,
      notes: ''
    });
  });

  it('should filter out placeholder objects with "?"', () => {
    const content = `{
  "maxAnimatedObjects": 20,
  "objects": [
    { "name": "Real Object", "startingRoomNumber": 1 },
    { "name": "?", "startingRoomNumber": 0 },
    { "name": "Another Real", "startingRoomNumber": 2 },
    { "name": "?", "startingRoomNumber": 0 }
  ]
}`;
    const result = extractObjects(content);

    expect(result).toHaveLength(2);
    expect(result[0].original).toBe('Real Object');
    expect(result[1].original).toBe('Another Real');
  });

  it('should preserve array indices correctly', () => {
    const content = `{
  "maxAnimatedObjects": 20,
  "objects": [
    { "name": "?", "startingRoomNumber": 0 },
    { "name": "?", "startingRoomNumber": 0 },
    { "name": "Item at Index 2", "startingRoomNumber": 5 },
    { "name": "?", "startingRoomNumber": 0 },
    { "name": "Item at Index 4", "startingRoomNumber": 10 }
  ]
}`;
    const result = extractObjects(content);

    expect(result).toHaveLength(2);
    expect(result[0].index).toBe(2);
    expect(result[0].original).toBe('Item at Index 2');
    expect(result[1].index).toBe(4);
    expect(result[1].original).toBe('Item at Index 4');
  });

  it('should handle empty object list', () => {
    const content = `{
  "maxAnimatedObjects": 20,
  "objects": []
}`;
    const result = extractObjects(content);

    expect(result).toHaveLength(0);
  });

  it('should handle all placeholder objects', () => {
    const content = `{
  "maxAnimatedObjects": 20,
  "objects": [
    { "name": "?", "startingRoomNumber": 0 },
    { "name": "?", "startingRoomNumber": 0 },
    { "name": "?", "startingRoomNumber": 0 }
  ]
}`;
    const result = extractObjects(content);

    expect(result).toHaveLength(0);
  });
});

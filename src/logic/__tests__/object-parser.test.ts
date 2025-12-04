import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import { parseObjectFile } from '../object-parser.js';

const fixturesDir = join(__dirname, 'fixtures');

describe('parseObjectFile', () => {
  it('should parse object.json file', () => {
    const content = readFileSync(join(fixturesDir, 'test-object.json'), 'utf-8');
    const result = parseObjectFile(content);

    expect(result.maxAnimatedObjects).toBe(16);
    expect(result.objects).toHaveLength(3); // Only non-"?" objects
  });

  it('should filter out objects with name "?"', () => {
    const content = readFileSync(join(fixturesDir, 'test-object.json'), 'utf-8');
    const result = parseObjectFile(content);

    const names = result.objects.map(obj => obj.name);
    expect(names).not.toContain('?');
    expect(names).toContain('Rock');
    expect(names).toContain('Key');
    expect(names).toContain('Flashlight');
  });

  it('should preserve array indices from original file', () => {
    const content = readFileSync(join(fixturesDir, 'test-object.json'), 'utf-8');
    const result = parseObjectFile(content);

    // Object 0 is "?" - should be filtered
    // Object 1 is "Rock"
    const rock = result.objects.find(obj => obj.name === 'Rock');
    expect(rock?.index).toBe(1);

    // Object 2 is "Key"
    const key = result.objects.find(obj => obj.name === 'Key');
    expect(key?.index).toBe(2);

    // Object 3 is "?" - should be filtered
    // Object 4 is "Flashlight"
    const flashlight = result.objects.find(obj => obj.name === 'Flashlight');
    expect(flashlight?.index).toBe(4);
  });

  it('should handle empty objects array', () => {
    const content = JSON.stringify({
      maxAnimatedObjects: 16,
      objects: []
    });
    const result = parseObjectFile(content);

    expect(result.objects).toHaveLength(0);
  });

  it('should handle all "?" objects', () => {
    const content = JSON.stringify({
      maxAnimatedObjects: 16,
      objects: [
        { name: '?', startingRoomNumber: 0 },
        { name: '?', startingRoomNumber: 0 }
      ]
    });
    const result = parseObjectFile(content);

    expect(result.objects).toHaveLength(0);
  });
});

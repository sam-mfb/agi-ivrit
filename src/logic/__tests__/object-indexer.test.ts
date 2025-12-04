import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import { parseObjectFile } from '../object-parser.js';
import { indexObjects } from '../object-indexer.js';

const fixturesDir = join(__dirname, 'fixtures');

describe('indexObjects', () => {
  const objectContent = readFileSync(join(fixturesDir, 'test-object.json'), 'utf-8');
  const objects = parseObjectFile(objectContent).objects;

  it('should replace exact object name matches in inventory commands only', () => {
    const logicContent = readFileSync(join(fixturesDir, 'objects.agilogic'), 'utf-8');
    const result = indexObjects(logicContent, objects);

    // Inventory commands should be replaced
    // "Key" at index 2 in get() should become i2
    expect(result.content).toContain('get(i2);');
    expect(result.content).not.toContain('get("Key");');

    // "Flashlight" at index 4 in drop() should become i4
    expect(result.content).toContain('drop(i4);');
    expect(result.content).not.toContain('drop("Flashlight");');

    // "Rock" at index 1 in put() should become i1
    expect(result.content).toContain('put(i1);');
    expect(result.content).not.toContain('put("Rock");');
  });

  it('should skip said() commands entirely', () => {
    const logicContent = readFileSync(join(fixturesDir, 'objects.agilogic'), 'utf-8');
    const result = indexObjects(logicContent, objects);

    // said() commands should not be touched
    expect(result.content).toContain('said("examine", "Rock")');
  });

  it('should not replace object names in non-inventory commands', () => {
    const logicContent = readFileSync(join(fixturesDir, 'objects.agilogic'), 'utf-8');
    const result = indexObjects(logicContent, objects);

    // print() takes messages, not inventory objects - should NOT be replaced
    expect(result.content).toContain('print("Rock");');
    expect(result.content).not.toContain('print(i1);');

    // "The Rock is heavy" in print() should NOT be replaced
    expect(result.content).toContain('"The Rock is heavy"');
    expect(result.content).not.toContain('i1 is heavy');
  });

  it('should count replaced objects correctly', () => {
    const logicContent = readFileSync(join(fixturesDir, 'objects.agilogic'), 'utf-8');
    const result = indexObjects(logicContent, objects);

    // Should count only inventory commands:
    // - get("Key") -> i2
    // - drop("Flashlight") -> i4
    // - put("Rock") -> i1
    // Total: 3
    // Note: print("Rock") is NOT replaced (it's a message command)
    expect(result.stats.replacedObjects).toBe(3);
  });

  it('should handle get() command', () => {
    const logicContent = readFileSync(join(fixturesDir, 'objects.agilogic'), 'utf-8');
    const result = indexObjects(logicContent, objects);

    expect(result.content).toContain('get(i2);');
    expect(result.content).not.toContain('get("Key");');
  });

  it('should handle put() command', () => {
    const logicContent = readFileSync(join(fixturesDir, 'objects.agilogic'), 'utf-8');
    const result = indexObjects(logicContent, objects);

    expect(result.content).toContain('put(i1);');
    expect(result.content).not.toContain('put("Rock");');
  });

  it('should handle drop() command', () => {
    const logicContent = readFileSync(join(fixturesDir, 'objects.agilogic'), 'utf-8');
    const result = indexObjects(logicContent, objects);

    expect(result.content).toContain('drop(i4);');
    expect(result.content).not.toContain('drop("Flashlight");');
  });

  it('should handle multiple inventory commands with the same object', () => {
    const content = `
get("Rock");
put("Rock");
drop("Rock");
return();
`;
    const result = indexObjects(content, objects);

    expect(result.content).toContain('get(i1);');
    expect(result.content).toContain('put(i1);');
    expect(result.content).toContain('drop(i1);');
    expect(result.stats.replacedObjects).toBe(3);
  });

  it('should not replace objects that are not in the object list', () => {
    const content = `
get("Unknown Object");
return();
`;
    const result = indexObjects(content, objects);

    expect(result.content).toContain('"Unknown Object"');
    expect(result.stats.replacedObjects).toBe(0);
  });

  it('should handle empty logic file', () => {
    const content = 'return();';
    const result = indexObjects(content, objects);

    expect(result.content).toBe('return();');
    expect(result.stats.replacedObjects).toBe(0);
  });

  it('should handle logic file with no object references', () => {
    const content = `
if (f5) {
  print("Hello");
}
return();
`;
    const result = indexObjects(content, objects);

    expect(result.content).toContain('print("Hello");');
    expect(result.stats.replacedObjects).toBe(0);
  });

  it('should handle empty object list', () => {
    const content = `
print("Rock");
return();
`;
    const result = indexObjects(content, []);

    expect(result.content).toContain('"Rock"');
    expect(result.stats.replacedObjects).toBe(0);
  });

  it('should preserve escaped quotes in object names', () => {
    const objectsWithQuotes = [
      { index: 1, name: 'Say "Hello"' }
    ];
    const content = `
get("Say \\"Hello\\"");
return();
`;
    const result = indexObjects(content, objectsWithQuotes);

    expect(result.content).toContain('get(i1);');
    expect(result.stats.replacedObjects).toBe(1);
  });

  it('should not replace in messages section', () => {
    const content = `
get("Rock");
return();

// messages
#message 1 "Rock"
`;
    const result = indexObjects(content, objects);

    // Should replace in code section
    expect(result.content).toContain('get(i1);');

    // Should NOT replace in messages section
    expect(result.content).toContain('#message 1 "Rock"');

    expect(result.stats.replacedObjects).toBe(1);
  });

  it('should handle multiple said() commands without replacing them', () => {
    const content = `
if (said("get", "Rock")) {
  get("Rock");
}

if (said("examine", "Key") || said("look", "Key")) {
  put("Key");
}
return();
`;
    const result = indexObjects(content, objects);

    // said() should not be touched
    expect(result.content).toContain('said("get", "Rock")');
    expect(result.content).toContain('said("examine", "Key")');
    expect(result.content).toContain('said("look", "Key")');

    // Inventory commands should be replaced
    expect(result.content).toContain('get(i1);');
    expect(result.content).toContain('put(i2);');

    expect(result.stats.replacedObjects).toBe(2);
  });
});

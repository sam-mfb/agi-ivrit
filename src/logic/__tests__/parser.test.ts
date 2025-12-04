import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import { parseLogicFile } from '../parser.js';

const FIXTURES_DIR = join(__dirname, 'fixtures');

function readFixture(filename: string): string {
  return readFileSync(join(FIXTURES_DIR, filename), 'utf-8');
}

describe('parseLogicFile', () => {
  describe('message extraction', () => {
    it('should extract all message declarations from simple fixture', () => {
      const content = readFixture('simple.agilogic');
      const result = parseLogicFile(content);

      expect(result.messages).toHaveLength(2);
      expect(result.messages[0]).toEqual({
        number: 1,
        text: 'Hello World',
        lineNumber: expect.any(Number),
      });
      expect(result.messages[1]).toEqual({
        number: 2,
        text: 'Goodbye',
        lineNumber: expect.any(Number),
      });
    });

    it('should extract messages from real AGI logic file', () => {
      const content = readFixture('0.agilogic');
      const result = parseLogicFile(content);

      // The file has 29 messages
      expect(result.messages).toHaveLength(29);
      expect(result.messages[0]).toEqual({
        number: 1,
        text: 'File',
        lineNumber: expect.any(Number),
      });
    });

    it('should handle escaped quotes in messages', () => {
      const content = `
print("test");
return();

// messages
#message 1 "I don't understand \\"word\\""
`;
      const result = parseLogicFile(content);

      expect(result.messages).toHaveLength(1);
      expect(result.messages[0].text).toBe('I don\'t understand \\"word\\"');
    });

    it('should handle messages with variable placeholders', () => {
      const content = `
return();

// messages
#message 1 "Score: %v0"
#message 2 "I don't understand \\"%w1\\""
`;
      const result = parseLogicFile(content);

      expect(result.messages).toHaveLength(2);
      expect(result.messages[0].text).toBe('Score: %v0');
      expect(result.messages[1].text).toBe('I don\'t understand \\"%w1\\"');
    });

    it('should handle non-sequential message numbers', () => {
      const content = `
return();

// messages
#message 1 "First"
#message 5 "Fifth"
#message 10 "Tenth"
`;
      const result = parseLogicFile(content);

      expect(result.messages).toHaveLength(3);
      expect(result.messages[0].number).toBe(1);
      expect(result.messages[1].number).toBe(5);
      expect(result.messages[2].number).toBe(10);
    });
  });

  describe('hardcoded string extraction', () => {
    it('should extract strings from print() commands', () => {
      const content = readFixture('simple.agilogic');
      const result = parseLogicFile(content);

      const printStrings = result.hardcodedStrings.filter(s => s.command === 'print');
      expect(printStrings.length).toBeGreaterThan(0);

      // Should find "Hello World" and "Welcome" (not the one in said())
      const texts = printStrings.map(s => s.text);
      expect(texts).toContain('Hello World');
      expect(texts).toContain('Welcome');
    });

    it('should extract strings from set.menu() commands', () => {
      const content = readFixture('simple.agilogic');
      const result = parseLogicFile(content);

      const menuStrings = result.hardcodedStrings.filter(s => s.command === 'set.menu');
      expect(menuStrings).toHaveLength(1);
      expect(menuStrings[0].text).toBe('File');
    });

    it('should extract strings from set.menu.item() commands', () => {
      const content = readFixture('simple.agilogic');
      const result = parseLogicFile(content);

      const menuItemStrings = result.hardcodedStrings.filter(s => s.command === 'set.menu.item');
      expect(menuItemStrings).toHaveLength(1);
      expect(menuItemStrings[0].text).toBe('Save');
    });

    it('should extract strings from display() commands', () => {
      const content = readFixture('simple.agilogic');
      const result = parseLogicFile(content);

      const displayStrings = result.hardcodedStrings.filter(s => s.command === 'display');
      expect(displayStrings).toHaveLength(1);
      expect(displayStrings[0].text).toBe('Test Display');
    });

    it('should NOT extract strings from said() commands', () => {
      const content = readFixture('simple.agilogic');
      const result = parseLogicFile(content);

      const saidStrings = result.hardcodedStrings.filter(s => s.command === 'said');
      expect(saidStrings).toHaveLength(0);
    });

    it('should handle strings with escaped quotes', () => {
      const content = `
print("He said \\"hello\\"");
return();
`;
      const result = parseLogicFile(content);

      expect(result.hardcodedStrings).toHaveLength(1);
      expect(result.hardcodedStrings[0].text).toBe('He said \\"hello\\"');
    });

    it('should capture line numbers correctly', () => {
      const content = `line 1
if (f5) {
  print("Test");
}
return();
`;
      const result = parseLogicFile(content);

      expect(result.hardcodedStrings[0].lineNumber).toBe(3);
    });

    it('should capture full line for context', () => {
      const content = `
if (f5) {
  print("Test Message");
}
return();
`;
      const result = parseLogicFile(content);

      expect(result.hardcodedStrings[0].fullLine).toContain('print("Test Message")');
    });

    it('should handle multiple strings on same line', () => {
      const content = `
print("First"); print("Second");
return();
`;
      const result = parseLogicFile(content);

      expect(result.hardcodedStrings).toHaveLength(2);
      expect(result.hardcodedStrings[0].text).toBe('First');
      expect(result.hardcodedStrings[1].text).toBe('Second');
    });

    it('should extract from all supported commands', () => {
      const content = `
print("print string");
display(0, 0, "display string");
set.menu("menu string");
set.menu.item("menu item string", c1);
get.num("get.num string", v0);
set.string(s0, "set.string value");
set.cursor.char("_");
return();
`;
      const result = parseLogicFile(content);

      expect(result.hardcodedStrings).toHaveLength(7);

      const commands = result.hardcodedStrings.map(s => s.command);
      expect(commands).toContain('print');
      expect(commands).toContain('display');
      expect(commands).toContain('set.menu');
      expect(commands).toContain('set.menu.item');
      expect(commands).toContain('get.num');
      expect(commands).toContain('set.string');
      expect(commands).toContain('set.cursor.char');
    });
  });

  describe('edge cases', () => {
    it('should handle empty logic file', () => {
      const content = 'return();';
      const result = parseLogicFile(content);

      expect(result.messages).toHaveLength(0);
      expect(result.hardcodedStrings).toHaveLength(0);
    });

    it('should handle file with only messages', () => {
      const content = `
return();

// messages
#message 1 "Only message"
`;
      const result = parseLogicFile(content);

      expect(result.messages).toHaveLength(1);
      expect(result.hardcodedStrings).toHaveLength(0);
    });

    it('should handle file with only code', () => {
      const content = `
print("Test");
return();
`;
      const result = parseLogicFile(content);

      expect(result.messages).toHaveLength(0);
      expect(result.hardcodedStrings).toHaveLength(1);
    });

    it('should preserve original content', () => {
      const content = readFixture('simple.agilogic');
      const result = parseLogicFile(content);

      expect(result.content).toBe(content);
    });
  });
});

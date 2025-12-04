import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import { parseLogicFile } from '../parser.js';
import { indexMessages } from '../indexer.js';

const FIXTURES_DIR = join(__dirname, 'fixtures');

function readFixture(filename: string): string {
  return readFileSync(join(FIXTURES_DIR, filename), 'utf-8');
}

describe('indexMessages', () => {
  describe('replacing existing messages', () => {
    it('should replace hardcoded string with message reference when exact match exists', () => {
      const content = `
if (f5) {
  print("Hello World");
}
return();

// messages
#message 1 "Hello World"
`;
      const logicFile = parseLogicFile(content);
      const result = indexMessages(logicFile);

      expect(result.content).toContain('print(m1)');
      expect(result.content).not.toContain('print("Hello World")');
      expect(result.stats.replacedStrings).toBe(1);
      expect(result.stats.newMessagesAdded).toBe(0);
    });

    it('should replace multiple occurrences of same string', () => {
      const content = readFixture('simple.agilogic');
      const logicFile = parseLogicFile(content);
      const result = indexMessages(logicFile);

      // "Hello World" appears twice in print() - both should be replaced with m1
      const printMatches = result.content.match(/print\(m1\)/g);
      expect(printMatches).toHaveLength(2);
      expect(result.stats.replacedStrings).toBeGreaterThanOrEqual(2);
    });

    it('should use exact match only (preserve whitespace)', () => {
      const content = `
print("Test");
print("Test ");
print(" Test");
return();

// messages
#message 1 "Test"
`;
      const logicFile = parseLogicFile(content);
      const result = indexMessages(logicFile);

      // "Test" matches existing message 1
      expect(result.content).toContain('print(m1)');
      // "Test " and " Test" don't match, so they're added as new messages
      expect(result.content).toContain('print(m2)');
      expect(result.content).toContain('print(m3)');
      // Only 1 string matched existing messages
      expect(result.stats.replacedStrings).toBe(1);
      // 2 new messages were added
      expect(result.stats.newMessagesAdded).toBe(2);
      // Verify the new messages preserve whitespace exactly
      expect(result.content).toContain('#message 2 "Test "');
      expect(result.content).toContain('#message 3 " Test"');
    });

    it('should match strings with special characters exactly', () => {
      const content = `
print("I don't understand \\"%w1\\"");
return();

// messages
#message 1 "I don't understand \\"%w1\\""
`;
      const logicFile = parseLogicFile(content);
      const result = indexMessages(logicFile);

      expect(result.content).toContain('print(m1)');
      expect(result.stats.replacedStrings).toBe(1);
    });
  });

  describe('adding new messages', () => {
    it('should add new message for string with no match', () => {
      const content = `
print("New Message");
return();

// messages
#message 1 "Existing"
`;
      const logicFile = parseLogicFile(content);
      const result = indexMessages(logicFile);

      // Should add #message 2 "New Message"
      expect(result.content).toContain('#message 2 "New Message"');
      expect(result.content).toContain('print(m2)');
      expect(result.stats.newMessagesAdded).toBe(1);
      expect(result.stats.finalMessageCount).toBe(2);
    });

    it('should use sequential numbering from max', () => {
      const content = `
print("First New");
print("Second New");
return();

// messages
#message 5 "Existing"
`;
      const logicFile = parseLogicFile(content);
      const result = indexMessages(logicFile);

      // Should add messages 6 and 7 (or 7 and 6, order doesn't matter)
      expect(result.content).toContain('#message 6 "');
      expect(result.content).toContain('#message 7 "');
      expect(result.stats.newMessagesAdded).toBe(2);
      expect(result.stats.finalMessageCount).toBe(3);
    });

    it('should handle adding messages when file has no existing messages', () => {
      const content = `
print("First");
print("Second");
return();
`;
      const logicFile = parseLogicFile(content);
      const result = indexMessages(logicFile);

      // Should add messages section and start from #message 1
      expect(result.content).toContain('// messages');
      expect(result.content).toContain('#message 1 "');
      expect(result.content).toContain('#message 2 "');
      expect(result.stats.newMessagesAdded).toBe(2);
    });

    it('should preserve escaped quotes in new messages', () => {
      const content = `
print("He said \\"hello\\"");
return();
`;
      const logicFile = parseLogicFile(content);
      const result = indexMessages(logicFile);

      expect(result.content).toContain('#message 1 "He said \\"hello\\""');
    });
  });

  describe('mixed operations', () => {
    it('should replace matches and add new messages', () => {
      const content = `
print("Existing");
print("New One");
print("Existing");
print("New Two");
return();

// messages
#message 1 "Existing"
`;
      const logicFile = parseLogicFile(content);
      const result = indexMessages(logicFile);

      // Two replacements of "Existing" with m1
      expect(result.stats.replacedStrings).toBe(2);
      // Two new messages added
      expect(result.stats.newMessagesAdded).toBe(2);
      expect(result.stats.finalMessageCount).toBe(3);
    });

    it('should handle the simple.agilogic fixture', () => {
      const content = readFixture('simple.agilogic');
      const logicFile = parseLogicFile(content);
      const result = indexMessages(logicFile);

      // "Hello World" exists as m1 - should replace both occurrences
      const m1Matches = result.content.match(/print\(m1\)/g);
      expect(m1Matches).toHaveLength(2);

      // "Welcome", "File", "Save", "Test Display" don't exist - should be added
      expect(result.stats.newMessagesAdded).toBeGreaterThan(0);

      // Should still have the messages section
      expect(result.content).toContain('// messages');
    });
  });

  describe('command-specific replacements', () => {
    it('should replace strings in all supported commands', () => {
      const content = `
print("Message One");
display(0, 0, "Message Two");
set.menu("Message Three");
set.menu.item("Message Four", c1);
return();

// messages
#message 1 "Message One"
#message 2 "Message Two"
#message 3 "Message Three"
#message 4 "Message Four"
`;
      const logicFile = parseLogicFile(content);
      const result = indexMessages(logicFile);

      expect(result.content).toContain('print(m1)');
      expect(result.content).toContain('display(0, 0, m2)');
      expect(result.content).toContain('set.menu(m3)');
      expect(result.content).toContain('set.menu.item(m4, c1)');
      expect(result.stats.replacedStrings).toBe(4);
    });

    it('should NOT touch said() commands', () => {
      const content = `
if (said("look")) {
  print("You look around");
}
return();
`;
      const logicFile = parseLogicFile(content);
      const result = indexMessages(logicFile);

      // said() should remain unchanged
      expect(result.content).toContain('said("look")');
      // Only print() string should be indexed
      expect(result.stats.newMessagesAdded).toBe(1);
    });
  });

  describe('statistics', () => {
    it('should track original message count', () => {
      const content = `
print("Test");
return();

// messages
#message 1 "One"
#message 2 "Two"
#message 3 "Three"
`;
      const logicFile = parseLogicFile(content);
      const result = indexMessages(logicFile);

      expect(result.stats.originalMessageCount).toBe(3);
    });

    it('should track final message count', () => {
      const content = `
print("New");
return();

// messages
#message 1 "Existing"
`;
      const logicFile = parseLogicFile(content);
      const result = indexMessages(logicFile);

      expect(result.stats.finalMessageCount).toBe(2);
    });

    it('should provide accurate statistics', () => {
      const content = `
print("Match");
print("New");
print("Match");
return();

// messages
#message 1 "Match"
`;
      const logicFile = parseLogicFile(content);
      const result = indexMessages(logicFile);

      expect(result.stats).toEqual({
        replacedStrings: 2,
        newMessagesAdded: 1,
        originalMessageCount: 1,
        finalMessageCount: 2,
      });
    });
  });

  describe('edge cases', () => {
    it('should handle empty logic file', () => {
      const content = 'return();';
      const logicFile = parseLogicFile(content);
      const result = indexMessages(logicFile);

      expect(result.content).toBe(content);
      expect(result.stats.replacedStrings).toBe(0);
      expect(result.stats.newMessagesAdded).toBe(0);
    });

    it('should preserve file structure and formatting', () => {
      const content = `if (f5) {
  print("Test");
}

return();


// messages
#message 1 "Existing"
`;
      const logicFile = parseLogicFile(content);
      const result = indexMessages(logicFile);

      // Should preserve blank lines and structure
      expect(result.content).toContain('if (f5) {');
      expect(result.content).toContain('return();');
    });

    it('should handle duplicate strings in different commands', () => {
      const content = `
print("Same");
set.menu("Same");
return();
`;
      const logicFile = parseLogicFile(content);
      const result = indexMessages(logicFile);

      // Both should reference the same message
      expect(result.content).toContain('print(m1)');
      expect(result.content).toContain('set.menu(m1)');
      expect(result.stats.newMessagesAdded).toBe(1); // Only one message added
    });

    it('should normalize escape sequences when matching against messages', () => {
      const content = `
print("Made of 100\\\\% synthetic materials");
return();

// messages
#message 1 "Made of 100\\% synthetic materials"
`;
      const logicFile = parseLogicFile(content);
      const result = indexMessages(logicFile);

      // The string in print has double backslash (100\\%) which normalizes to single backslash
      // The message has single backslash (100\%)
      // These should match - both represent the same displayed text
      expect(result.content).toContain('print(m1)');
      expect(result.stats.replacedStrings).toBe(1);
      expect(result.stats.newMessagesAdded).toBe(0); // Should NOT add a new message
    });

    it('should normalize tab escape sequences', () => {
      const content = `
print("Line with\\ttab");
return();

// messages
#message 1 "Line with\ttab"
`;
      const logicFile = parseLogicFile(content);
      const result = indexMessages(logicFile);

      // The string in code has \t (backslash-t) which normalizes to actual tab
      // The message has actual tab character
      // These should match
      expect(result.content).toContain('print(m1)');
      expect(result.stats.replacedStrings).toBe(1);
      expect(result.stats.newMessagesAdded).toBe(0);
    });
  });
});

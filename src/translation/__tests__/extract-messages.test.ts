import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import { extractMessages } from '../extract-messages.js';

const FIXTURES_DIR = join(__dirname, '../../logic/__tests__/fixtures');

describe('extractMessages', () => {
  it('should extract messages from a single logic file', () => {
    const content = readFileSync(join(FIXTURES_DIR, 'simple.agilogic'), 'utf-8');
    const result = extractMessages('simple.agilogic', content);

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({
      logicFile: 'simple.agilogic',
      messageNumber: 1,
      original: 'Hello World',
      translation: '',
      notes: '',
      placeholders: []
    });
    expect(result[1]).toEqual({
      logicFile: 'simple.agilogic',
      messageNumber: 2,
      original: 'Goodbye',
      translation: '',
      notes: '',
      placeholders: []
    });
  });

  it('should detect placeholders in messages', () => {
    const content = `
print(m1);
return();

// messages
#message 1 "You don't understand \\"%w1\\""
#message 2 "Score: %v points"
#message 3 "The %s is here"
#message 4 "%m1 and more text"
`;
    const result = extractMessages('test.agilogic', content);

    expect(result).toHaveLength(4);

    expect(result[0].placeholders).toEqual(['%w1']);
    expect(result[1].placeholders).toEqual(['%v']);
    expect(result[2].placeholders).toEqual(['%s']);
    expect(result[3].placeholders).toEqual(['%m1']);
  });

  it('should detect multiple placeholders in one message', () => {
    const content = `
return();

// messages
#message 1 "You see %w1, %w2, and %w3"
`;
    const result = extractMessages('test.agilogic', content);

    expect(result[0].placeholders).toEqual(['%w1', '%w2', '%w3']);
  });

  it('should handle messages with no placeholders', () => {
    const content = `
return();

// messages
#message 1 "Plain text message"
#message 2 "Another message without placeholders"
`;
    const result = extractMessages('test.agilogic', content);

    expect(result).toHaveLength(2);
    expect(result[0].placeholders).toEqual([]);
    expect(result[1].placeholders).toEqual([]);
  });

  it('should handle files with no messages section', () => {
    const content = `
if (f5) {
  print("This shouldn't be extracted");
}
return();
`;
    const result = extractMessages('test.agilogic', content);

    expect(result).toHaveLength(0);
  });

  it('should preserve escaped quotes in message text', () => {
    const content = `
return();

// messages
#message 1 "He said \\"hello\\""
`;
    const result = extractMessages('test.agilogic', content);

    expect(result[0].original).toBe('He said \\"hello\\"');
  });

  it('should handle messages with special characters', () => {
    const content = `
return();

// messages
#message 1 "Made of 100\\\\% synthetic materials"
#message 2 "Line with\\ttab"
`;
    const result = extractMessages('test.agilogic', content);

    expect(result[0].original).toBe('Made of 100\\\\% synthetic materials');
    expect(result[1].original).toBe('Line with\\ttab');
  });

  it('should handle non-sequential message numbers', () => {
    const content = `
return();

// messages
#message 1 "First"
#message 5 "Fifth"
#message 10 "Tenth"
`;
    const result = extractMessages('test.agilogic', content);

    expect(result).toHaveLength(3);
    expect(result[0].messageNumber).toBe(1);
    expect(result[1].messageNumber).toBe(5);
    expect(result[2].messageNumber).toBe(10);
  });
});

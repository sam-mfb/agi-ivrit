import { describe, it, expect } from 'vitest';
import { extractVocabulary } from '../extract-vocabulary.js';

describe('extractVocabulary', () => {
  it('should extract vocabulary with base word and synonyms', () => {
    const content = `0: a an the
2: look examine
5: get take "pick up"
`;
    const result = extractVocabulary(content);

    expect(result).toHaveLength(3);

    expect(result[0]).toEqual({
      wordNumber: 0,
      word: 'a',
      originalSynonyms: ['an', 'the'],
      translatedSynonyms: [],
      notes: ''
    });

    expect(result[1]).toEqual({
      wordNumber: 2,
      word: 'look',
      originalSynonyms: ['examine'],
      translatedSynonyms: [],
      notes: ''
    });

    expect(result[2]).toEqual({
      wordNumber: 5,
      word: 'get',
      originalSynonyms: ['take', 'pick up'],
      translatedSynonyms: [],
      notes: ''
    });
  });

  it('should handle multi-word phrases in quotes', () => {
    const content = `20: "check out" examine "look at" inspect`;
    const result = extractVocabulary(content);

    expect(result).toHaveLength(1);
    expect(result[0].word).toBe('check out');
    expect(result[0].originalSynonyms).toEqual(['examine', 'look at', 'inspect']);
  });

  it('should handle non-sequential word numbers', () => {
    const content = `1: one
5: five
10: ten
`;
    const result = extractVocabulary(content);

    expect(result).toHaveLength(3);
    expect(result[0].wordNumber).toBe(1);
    expect(result[1].wordNumber).toBe(5);
    expect(result[2].wordNumber).toBe(10);
  });

  it('should handle single word with no synonyms', () => {
    const content = `1: quit
2: restart
3: save
`;
    const result = extractVocabulary(content);

    expect(result).toHaveLength(3);
    expect(result[0].word).toBe('quit');
    expect(result[0].originalSynonyms).toEqual([]);
  });

  it('should handle empty file', () => {
    const content = '';
    const result = extractVocabulary(content);

    expect(result).toHaveLength(0);
  });

  it('should skip empty lines and comments', () => {
    const content = `
1: one

2: two
# This is a comment
3: three
`;
    const result = extractVocabulary(content);

    expect(result).toHaveLength(3);
  });

  it('should preserve mixed quotes and unquoted words', () => {
    const content = `10: go walk "go to" "walk to" move`;
    const result = extractVocabulary(content);

    expect(result[0].word).toBe('go');
    expect(result[0].originalSynonyms).toEqual(['walk', 'go to', 'walk to', 'move']);
  });
});

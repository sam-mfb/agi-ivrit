import * as iconv from 'iconv-lite';
import type { VocabularyFile, TranslationVocabulary } from './types.js';

/**
 * Hebrew prepositional prefixes to add to nouns
 * ב (in/at), ה (the), ל (to/for)
 */
const HEBREW_PREFIXES = ['ב', 'ה', 'ל'];

/**
 * Check if a character is Hebrew (Unicode range)
 */
function isHebrewChar(char: string): boolean {
  const code = char.charCodeAt(0);
  return code >= 0x0590 && code <= 0x05ff;
}

/**
 * Check if a word/phrase starts with Hebrew
 */
function startsWithHebrew(word: string): boolean {
  return word.length > 0 && isHebrewChar(word[0]);
}

/**
 * Check if a word group is a noun (should get prefix variants)
 */
function isNounGroup(group: TranslationVocabulary): boolean {
  // Word #0 is filler words - not nouns
  if (group.wordNumber === 0) return false;

  return group.wordType === 'noun';
}

/**
 * Generate Hebrew prefix variants for a word/phrase
 * For "בית" returns ["הבית", "בבית", "לבית"]
 * For "בית לבן" returns ["הבית לבן", "בבית לבן", "לבית לבן"]
 */
function generatePrefixVariants(word: string): string[] {
  if (!startsWithHebrew(word)) return [];

  const variants: string[] = [];

  // For phrases, we prefix the first word only
  const spaceIndex = word.indexOf(' ');
  if (spaceIndex > 0) {
    const firstWord = word.substring(0, spaceIndex);
    const rest = word.substring(spaceIndex); // includes the space

    for (const prefix of HEBREW_PREFIXES) {
      variants.push(prefix + firstWord + rest);
    }
  } else {
    // Single word
    for (const prefix of HEBREW_PREFIXES) {
      variants.push(prefix + word);
    }
  }

  return variants;
}

/**
 * Information about a duplicate word occurrence
 */
export interface DuplicateInfo {
  word: string;
  occurrences: Array<{ wordNumber: number; source: string }>;
}

/**
 * Information about a skipped prefix variant due to conflict
 */
export interface SkippedVariantInfo {
  variant: string;
  baseSynonym: string;
  sourceWordNumber: number;
  sourceWord: string;
  conflictWordNumber: number;
  conflictWord: string;
}

/**
 * Find duplicate words in vocabulary that map to different word numbers.
 * Each word must map to exactly one word number for the AGI parser.
 * This includes checking generated prefix variants (ב, ה, ל) for noun groups,
 * but skips variants that conflict with existing words (those are not generated).
 *
 * @param vocabulary - The vocabulary data from vocabulary.json
 * @returns Array of duplicates (words that map to multiple word numbers)
 */
export function findDuplicateWords(vocabulary: VocabularyFile): DuplicateInfo[] {
  // First pass: collect all existing words (without prefix variants)
  // to know which prefix variants would conflict (and thus won't be generated)
  const existingWords = new Set<string>();
  for (const group of vocabulary.vocabulary) {
    existingWords.add(group.word.toLowerCase());
    for (const syn of group.originalSynonyms) {
      existingWords.add(syn.toLowerCase());
    }
    for (const syn of group.translatedSynonyms) {
      existingWords.add(syn.toLowerCase());
    }
  }

  // Map: lowercase word -> array of { wordNumber, source description }
  const wordMap = new Map<string, Array<{ wordNumber: number; source: string }>>();

  // Helper to add a word to the map
  const addWord = (word: string, wordNumber: number, source: string) => {
    const key = word.toLowerCase();
    if (!wordMap.has(key)) wordMap.set(key, []);
    wordMap.get(key)!.push({ wordNumber, source });
  };

  for (const group of vocabulary.vocabulary) {
    const wordNum = group.wordNumber;
    const isNoun = isNounGroup(group);

    // Add base word
    addWord(group.word, wordNum, 'base word');

    // Add original synonyms
    for (const syn of group.originalSynonyms) {
      addWord(syn, wordNum, 'original synonym');
    }

    // Add translated synonyms
    for (const syn of group.translatedSynonyms) {
      addWord(syn, wordNum, 'translated synonym');

      // For noun groups, also check prefix variants (ב, ה, ל)
      // but skip variants that conflict with existing words
      if (isNoun) {
        const variants = generatePrefixVariants(syn);
        for (const variant of variants) {
          // Only check if this variant doesn't already exist as a word elsewhere
          if (!existingWords.has(variant.toLowerCase())) {
            addWord(variant, wordNum, 'prefix variant');
          }
        }
      }
    }
  }

  // Find duplicates (words mapping to multiple word numbers)
  const duplicates: DuplicateInfo[] = [];
  for (const [word, occurrences] of wordMap) {
    const uniqueWordNumbers = new Set(occurrences.map((o) => o.wordNumber));
    if (uniqueWordNumbers.size > 1) {
      duplicates.push({ word, occurrences });
    }
  }

  return duplicates;
}

/**
 * Find prefix variants that were skipped due to conflicts with existing words.
 * These are Hebrew homographs where the prefixed form already exists as a different word.
 *
 * @param vocabulary - The vocabulary data from vocabulary.json
 * @returns Array of skipped variants with conflict information
 */
export function findSkippedPrefixVariants(vocabulary: VocabularyFile): SkippedVariantInfo[] {
  // Build word -> group mapping
  const wordToGroup = new Map<string, TranslationVocabulary>();
  for (const group of vocabulary.vocabulary) {
    wordToGroup.set(group.word.toLowerCase(), group);
    for (const syn of group.originalSynonyms) {
      wordToGroup.set(syn.toLowerCase(), group);
    }
    for (const syn of group.translatedSynonyms) {
      wordToGroup.set(syn.toLowerCase(), group);
    }
  }

  const skipped: SkippedVariantInfo[] = [];

  for (const group of vocabulary.vocabulary) {
    if (!isNounGroup(group)) continue;

    for (const syn of group.translatedSynonyms) {
      const variants = generatePrefixVariants(syn);
      for (const variant of variants) {
        const conflictGroup = wordToGroup.get(variant.toLowerCase());
        if (conflictGroup && conflictGroup.wordNumber !== group.wordNumber) {
          skipped.push({
            variant,
            baseSynonym: syn,
            sourceWordNumber: group.wordNumber,
            sourceWord: group.word,
            conflictWordNumber: conflictGroup.wordNumber,
            conflictWord: conflictGroup.word,
          });
        }
      }
    }
  }

  return skipped;
}

/**
 * Generate WORDS.TOK.EXTENDED file content from vocabulary data.
 *
 * This file is used by ScummVM at runtime to parse player input with
 * extended characters (Hebrew vocabulary).
 *
 * Format:
 * - Line 1: Header comment
 * - Subsequent lines: <word><null_byte><word_number><newline>
 *
 * For noun groups, Hebrew words also get prefix variants (ב, ה, ל),
 * but only if they don't conflict with existing words.
 *
 * @param vocabulary - The vocabulary data from vocabulary.json
 * @returns Buffer containing Windows-1255 encoded file content
 */
export function generateWordsExtended(vocabulary: VocabularyFile): Buffer {
  // First pass: collect all existing words (without prefix variants)
  // to know which prefix variants would conflict
  const existingWords = new Set<string>();
  for (const group of vocabulary.vocabulary) {
    existingWords.add(group.word.toLowerCase());
    for (const syn of group.originalSynonyms) {
      existingWords.add(syn.toLowerCase());
    }
    for (const syn of group.translatedSynonyms) {
      existingWords.add(syn.toLowerCase());
    }
  }

  const lines: string[] = [];
  const addedWords = new Set<string>(); // Track added words to avoid duplicates within same word number

  // Helper to add a word line, avoiding duplicates
  const addWord = (word: string, wordNum: string) => {
    const key = `${word.toLowerCase()}\0${wordNum}`;
    if (!addedWords.has(key)) {
      addedWords.add(key);
      lines.push(`${word}\0${wordNum}`);
    }
  };

  // Header line (matches format from TRANSLATION_ARCHITECTURE.md)
  lines.push('WORDS.TOK: Unofficial extended format to support ASCII range of 128-255');

  // Process each word group
  for (const group of vocabulary.vocabulary) {
    const wordNum = group.wordNumber.toString().padStart(5, '0');
    const isNoun = isNounGroup(group);

    // Add base word
    addWord(group.word, wordNum);

    // Add original synonyms
    for (const synonym of group.originalSynonyms) {
      addWord(synonym, wordNum);
    }

    // Add translated synonyms (will be empty if not yet translated)
    for (const synonym of group.translatedSynonyms) {
      addWord(synonym, wordNum);

      // For noun groups, add Hebrew prefix variants (ב, ה, ל)
      // but skip variants that conflict with existing words
      if (isNoun) {
        const variants = generatePrefixVariants(synonym);
        for (const variant of variants) {
          // Only add if this variant doesn't already exist as a word elsewhere
          if (!existingWords.has(variant.toLowerCase())) {
            addWord(variant, wordNum);
          }
        }
      }
    }
  }

  // Join with newlines and encode as Windows-1255
  const content = lines.join('\n') + '\n';
  return iconv.encode(content, 'windows-1255');
}

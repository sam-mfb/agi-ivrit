import type { TranslationVocabulary } from './types.js';

/**
 * Extract translatable vocabulary from words.txt content
 * Format: <word_number>: <synonym1> <synonym2> "multi word" ...
 * First synonym is treated as the "base word" used in said() commands
 */
export function extractVocabulary(wordsContent: string): TranslationVocabulary[] {
  const vocabulary: TranslationVocabulary[] = [];
  const lines = wordsContent.split('\n');

  for (const line of lines) {
    const trimmed = line.trim();

    // Skip empty lines and comments
    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }

    // Parse line format: <number>: <words>
    const colonIndex = trimmed.indexOf(':');
    if (colonIndex === -1) {
      continue;
    }

    const wordNumberStr = trimmed.substring(0, colonIndex).trim();
    const wordsStr = trimmed.substring(colonIndex + 1).trim();

    const wordNumber = parseInt(wordNumberStr, 10);
    if (isNaN(wordNumber)) {
      continue;
    }

    // Parse synonyms (space-separated, with quoted multi-word phrases)
    const allWords = parseWords(wordsStr);

    // First word is the base word, rest are synonyms
    const word = allWords.length > 0 ? allWords[0] : '';
    const originalSynonyms = allWords.slice(1);

    vocabulary.push({
      wordNumber,
      word,
      originalSynonyms,
      translatedSynonyms: [],
      wordType: '',
      notes: ''
    });
  }

  return vocabulary;
}

/**
 * Parse space-separated words, handling quoted multi-word phrases
 */
function parseWords(wordsStr: string): string[] {
  const words: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < wordsStr.length; i++) {
    const char = wordsStr[i];

    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ' ' && !inQuotes) {
      // Space outside quotes - word boundary
      if (current.trim()) {
        words.push(current.trim());
        current = '';
      }
    } else {
      current += char;
    }
  }

  // Add last word
  if (current.trim()) {
    words.push(current.trim());
  }

  return words;
}

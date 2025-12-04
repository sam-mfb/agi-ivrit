/**
 * Type definitions for AGI game translation workflow
 */

/**
 * A single translatable message from a logic file
 */
export interface TranslationMessage {
  /** Source logic file name (e.g., "0.agilogic") */
  logicFile: string;
  /** Message number within that logic file */
  messageNumber: number;
  /** Original English text */
  original: string;
  /** Translated text (empty until translated) */
  translation: string;
  /** Optional notes for translators */
  notes: string;
  /** Detected placeholders (%w1, %v, %s, %m, etc.) */
  placeholders: string[];
}

/**
 * Messages extraction output file
 */
export interface MessagesFile {
  version: string;
  metadata: {
    gameName: string;
    contentType: 'messages';
    sourceLanguage: string;
    targetLanguage: string;
    extractedDate: string;
    totalMessages: number;
  };
  messages: TranslationMessage[];
}

/**
 * A single translatable inventory object
 */
export interface TranslationObject {
  /** Object index (array position in object.json) */
  index: number;
  /** Original English name */
  original: string;
  /** Translated name (empty until translated) */
  translation: string;
  /** Starting room number (0 = inventory, 255 = not in game, etc.) */
  startingRoom: number;
  /** Optional notes for translators */
  notes: string;
}

/**
 * Objects extraction output file
 */
export interface ObjectsFile {
  version: string;
  metadata: {
    gameName: string;
    contentType: 'objects';
    sourceLanguage: string;
    targetLanguage: string;
    extractedDate: string;
    totalObjects: number;
    maxAnimatedObjects: number;
  };
  objects: TranslationObject[];
}

/** Word type classification for vocabulary entries */
export type WordType = '' | 'noun' | 'verb' | 'other';

/**
 * A vocabulary word group with its synonyms
 * The first word in originalSynonyms is the "base word" used in said() commands
 */
export interface TranslationVocabulary {
  /** Word number used in AGI logic (same number = synonyms) */
  wordNumber: number;
  /** Base word used in said() commands in logic files */
  word: string;
  /** Other English synonyms (not including the base word) */
  originalSynonyms: string[];
  /** Translated synonyms in target language */
  translatedSynonyms: string[];
  /** Word type classification (noun, verb, other, or empty if unclassified) */
  wordType: WordType;
  /** Optional notes for this word group */
  notes: string;
}

/**
 * Vocabulary extraction output file
 */
export interface VocabularyFile {
  version: string;
  metadata: {
    gameName: string;
    contentType: 'vocabulary';
    sourceLanguage: string;
    targetLanguage: string;
    extractedDate: string;
    totalWordGroups: number;
  };
  vocabulary: TranslationVocabulary[];
}

/**
 * A single translatable view description
 * View descriptions are text embedded in VIEW resources (inventory item descriptions)
 */
export interface TranslationView {
  /** View resource number (e.g., 220 for 220.agiviewdesc) */
  viewNumber: number;
  /** Original English description text */
  original: string;
  /** Translated description (empty until translated) */
  translation: string;
  /** Optional notes for translators */
  notes: string;
}

/**
 * Views extraction output file
 */
export interface ViewsFile {
  version: string;
  metadata: {
    gameName: string;
    contentType: 'views';
    sourceLanguage: string;
    targetLanguage: string;
    extractedDate: string;
    totalViews: number;
  };
  views: TranslationView[];
}

/**
 * Result of an extraction operation
 */
export interface ExtractionResult {
  /** Number of items extracted */
  count: number;
  /** Output file path */
  outputFile: string;
}

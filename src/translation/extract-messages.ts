import type { TranslationMessage } from './types.js';
import { parseLogicFile } from '../logic/parser.js';

/**
 * Extract translatable messages from a logic file
 */
export function extractMessages(
  logicFileName: string,
  logicContent: string
): TranslationMessage[] {
  const logicFile = parseLogicFile(logicContent);
  const messages: TranslationMessage[] = [];

  for (const msg of logicFile.messages) {
    const placeholders = detectPlaceholders(msg.text);

    messages.push({
      logicFile: logicFileName,
      messageNumber: msg.number,
      original: msg.text,
      translation: '',
      notes: '',
      placeholders
    });
  }

  return messages;
}

/**
 * Detect all placeholders in a message string
 * Placeholders: %w1, %w2, %w3, %v, %s, %m<number>
 */
function detectPlaceholders(text: string): string[] {
  const placeholders: string[] = [];

  // Match %w1, %w2, %w3 (word parameters)
  const wordMatches = text.match(/%w[1-3]/g);
  if (wordMatches) {
    placeholders.push(...wordMatches);
  }

  // Match %v (variable)
  if (text.includes('%v')) {
    placeholders.push('%v');
  }

  // Match %s (string)
  if (text.includes('%s')) {
    placeholders.push('%s');
  }

  // Match %m<number> (message reference)
  const messageMatches = text.match(/%m\d+/g);
  if (messageMatches) {
    placeholders.push(...messageMatches);
  }

  return placeholders;
}

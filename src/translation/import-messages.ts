import type { TranslationMessage } from './types.js';

/**
 * Apply message translations to a logic file
 * Only replaces messages that have non-empty translation strings
 */
export function importMessages(
  logicFileContent: string,
  translations: TranslationMessage[]
): string {
  // Build a map of message number to translation
  const translationMap = new Map<number, string>();
  for (const trans of translations) {
    // Only include translations with non-empty strings
    if (trans.translation && trans.translation.trim() !== '') {
      translationMap.set(trans.messageNumber, trans.translation);
    }
  }

  // If no translations to apply, return unchanged
  if (translationMap.size === 0) {
    return logicFileContent;
  }

  // Split into lines and process
  const lines = logicFileContent.split('\n');
  const processedLines: string[] = [];

  for (const line of lines) {
    // Check if this is a message declaration line
    const messageMatch = line.match(/^#message\s+(\d+)\s+"(.*)"/);

    if (messageMatch) {
      const messageNumber = parseInt(messageMatch[1], 10);

      if (translationMap.has(messageNumber)) {
        // Replace with translation
        const translation = translationMap.get(messageNumber)!;
        // Preserve indentation if any
        const indent = line.match(/^(\s*)/)?.[1] || '';
        processedLines.push(`${indent}#message ${messageNumber} "${translation}"`);
      } else {
        // Keep original
        processedLines.push(line);
      }
    } else {
      // Not a message line, keep as is
      processedLines.push(line);
    }
  }

  return processedLines.join('\n');
}

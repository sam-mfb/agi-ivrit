import type { LogicFile, IndexResult, LogicMessage } from './types.js';

/**
 * Normalize escape sequences in a string for comparison
 * In AGI logic files, strings in code have escape sequences that get interpreted
 * We need to normalize them to match how they're stored in message declarations
 */
function normalizeEscapeSequences(text: string): string {
  return text
    // Replace escape sequences with their actual characters
    .replace(/\\t/g, '\t')   // tab
    .replace(/\\n/g, '\n')   // newline
    .replace(/\\r/g, '\r')   // carriage return
    .replace(/\\\\/g, '\\'); // backslash (do this last to avoid double-processing)
}

/**
 * Index messages in a logic file by replacing hardcoded strings with message references
 * and adding new messages for strings that don't have matches
 */
export function indexMessages(logicFile: LogicFile): IndexResult {
  const originalMessageCount = logicFile.messages.length;
  let content = logicFile.content;
  let replacedStrings = 0;

  // Build a map of message text to message number for exact matching
  // Also build a normalized version for matching code strings
  const messageMap = new Map<string, number>();
  const normalizedMessageMap = new Map<string, number>();
  for (const msg of logicFile.messages) {
    messageMap.set(msg.text, msg.number);
    normalizedMessageMap.set(normalizeEscapeSequences(msg.text), msg.number);
  }

  // Track new messages to add
  const newMessages: Array<{ text: string; number: number }> = [];
  const maxMessageNumber = logicFile.messages.length > 0
    ? Math.max(...logicFile.messages.map(m => m.number))
    : 0;
  let nextMessageNumber = maxMessageNumber + 1;

  // Process each unique hardcoded string
  const processedStrings = new Set<string>();
  const matchedReplacements = new Map<string, number>(); // Strings matching existing messages
  const newReplacements = new Map<string, number>();     // Strings needing new messages

  for (const hardcoded of logicFile.hardcodedStrings) {
    // Skip if we already processed this exact string
    if (processedStrings.has(hardcoded.text)) {
      continue;
    }

    let messageNumber: number;
    const normalizedText = normalizeEscapeSequences(hardcoded.text);

    // Check if we already have this string as a message (try normalized match)
    if (normalizedMessageMap.has(normalizedText)) {
      messageNumber = normalizedMessageMap.get(normalizedText)!;
      matchedReplacements.set(hardcoded.text, messageNumber);
    } else {
      // Add as new message (store the normalized version)
      messageNumber = nextMessageNumber++;
      newMessages.push({ text: normalizedText, number: messageNumber });
      normalizedMessageMap.set(normalizedText, messageNumber);
      newReplacements.set(hardcoded.text, messageNumber);
    }

    processedStrings.add(hardcoded.text);
  }

  // Apply all replacements in code section only
  const messagesSectionStart = content.indexOf('// messages');
  let codeSection = messagesSectionStart !== -1 ? content.substring(0, messagesSectionStart) : content;
  const messagesSection = messagesSectionStart !== -1 ? content.substring(messagesSectionStart) : '';

  // Replace matched strings (count these as replacedStrings)
  for (const [text, messageNumber] of matchedReplacements) {
    const escapedForRegex = text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const countBefore = (codeSection.match(new RegExp(`"${escapedForRegex}"`, 'g')) || []).length;
    codeSection = replaceStringInCommand(codeSection, text, messageNumber);
    replacedStrings += countBefore;
  }

  // Replace new strings (don't count these as replacedStrings, they're newMessagesAdded)
  for (const [text, messageNumber] of newReplacements) {
    codeSection = replaceStringInCommand(codeSection, text, messageNumber);
  }

  // Reconstruct the content
  content = codeSection + messagesSection;

  // Add new messages to the file
  if (newMessages.length > 0) {
    content = addNewMessages(content, newMessages);
  }

  const stats = {
    replacedStrings,
    newMessagesAdded: newMessages.length,
    originalMessageCount,
    finalMessageCount: originalMessageCount + newMessages.length,
  };

  return { content, stats };
}

/**
 * Replace a hardcoded string with a message reference in the content
 * Skips said() commands since they require vocabulary words, not messages
 */
function replaceStringInCommand(
  content: string,
  text: string,
  messageNumber: number
): string {
  // Escape special regex characters in the text
  const escapedText = text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  // Create pattern to match the exact string literal with quotes
  const pattern = new RegExp(`"${escapedText}"`, 'g');

  // Replace line by line, skipping said() commands
  const lines = content.split('\n');
  const processedLines = lines.map(line => {
    // Skip said() commands entirely
    if (line.includes('said(')) {
      return line;
    }
    return line.replace(pattern, `m${messageNumber}`);
  });

  return processedLines.join('\n');
}

/**
 * Add new messages to the messages section
 */
function addNewMessages(
  content: string,
  newMessages: Array<{ text: string; number: number }>
): string {
  // Find the messages section
  const lines = content.split('\n');
  const messagesSectionIndex = lines.findIndex(line => line.trim() === '// messages');

  if (messagesSectionIndex === -1) {
    // No messages section exists, create one
    const newMessagesText = newMessages
      .map(m => `#message ${m.number} "${m.text}"`)
      .join('\n');

    return content + '\n\n// messages\n' + newMessagesText + '\n';
  } else {
    // Append to existing messages section
    const newMessagesText = newMessages
      .map(m => `#message ${m.number} "${m.text}"`)
      .join('\n');

    // Add after the last line (before final newline if present)
    return content.trimEnd() + '\n' + newMessagesText + '\n';
  }
}

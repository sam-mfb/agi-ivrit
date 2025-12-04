import type { LogicFile, LogicMessage, HardcodedString } from './types.js';

/**
 * Commands that contain translatable strings
 */
const TRANSLATABLE_COMMANDS = [
  'print',
  'print.at',
  'display',
  'set.menu',
  'set.menu.item',
  'get.num',
  'get.string',
  'set.string',
  'set.cursor.char',
];

/**
 * Regex to match #message declarations
 * Captures: message number and message text
 */
const MESSAGE_PATTERN = /^#message\s+(\d+)\s+"((?:[^"\\]|\\.)*)"\s*$/gm;

/**
 * Regex to match string literals in double quotes
 * Handles escaped quotes
 */
const STRING_LITERAL_PATTERN = /"((?:[^"\\]|\\.)*)"/g;

/**
 * Parse an AGI logic file and extract messages and hardcoded strings
 */
export function parseLogicFile(content: string): LogicFile {
  const messages = extractMessages(content);
  const hardcodedStrings = extractHardcodedStrings(content);

  return {
    content,
    messages,
    hardcodedStrings,
  };
}

/**
 * Extract all #message declarations from the file
 */
function extractMessages(content: string): LogicMessage[] {
  const messages: LogicMessage[] = [];
  const lines = content.split('\n');

  // Find the messages section (starts with "// messages")
  let inMessagesSection = false;
  let lineNumber = 0;

  for (const line of lines) {
    lineNumber++;

    if (line.trim() === '// messages') {
      inMessagesSection = true;
      continue;
    }

    if (inMessagesSection) {
      const match = /^#message\s+(\d+)\s+"((?:[^"\\]|\\.)*)"/.exec(line);
      if (match) {
        messages.push({
          number: parseInt(match[1], 10),
          text: match[2],
          lineNumber,
        });
      }
    }
  }

  return messages;
}

/**
 * Extract all hardcoded string literals from translatable commands
 */
function extractHardcodedStrings(content: string): HardcodedString[] {
  const hardcodedStrings: HardcodedString[] = [];
  const lines = content.split('\n');

  let lineNumber = 0;
  for (const line of lines) {
    lineNumber++;

    // Skip the messages section
    if (line.trim() === '// messages') {
      break;
    }

    // Skip said() commands entirely
    if (line.includes('said(')) {
      continue;
    }

    // Check each translatable command
    for (const command of TRANSLATABLE_COMMANDS) {
      const commandPattern = new RegExp(`\\b${escapeRegex(command)}\\s*\\(`);
      if (commandPattern.test(line)) {
        // Extract all string literals from this line
        const stringMatches = [...line.matchAll(STRING_LITERAL_PATTERN)];
        for (const match of stringMatches) {
          hardcodedStrings.push({
            command,
            text: match[1],
            lineNumber,
            fullLine: line.trim(),
          });
        }
      }
    }
  }

  return hardcodedStrings;
}

/**
 * Escape special regex characters
 */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Represents a message declaration in an AGI logic file
 */
export interface LogicMessage {
  /** Message number (e.g., 1, 2, 3) */
  number: number;
  /** The message text content */
  text: string;
  /** Line number in the file where this message is declared */
  lineNumber: number;
}

/**
 * Represents a hardcoded string literal found in AGI logic code
 */
export interface HardcodedString {
  /** The command that contains this string (e.g., "print", "display", "set.menu") */
  command: string;
  /** The string literal text (without quotes) */
  text: string;
  /** Line number where this string appears */
  lineNumber: number;
  /** The full line of code for context */
  fullLine: string;
}

/**
 * Represents a parsed AGI logic file
 */
export interface LogicFile {
  /** The original file content */
  content: string;
  /** All message declarations found in the file */
  messages: LogicMessage[];
  /** All hardcoded strings found in commands */
  hardcodedStrings: HardcodedString[];
}

/**
 * Result of indexing messages in a logic file
 */
export interface IndexResult {
  /** The transformed logic file content */
  content: string;
  /** Statistics about the transformation */
  stats: {
    /** Number of hardcoded strings replaced with message references */
    replacedStrings: number;
    /** Number of new messages added */
    newMessagesAdded: number;
    /** Original message count */
    originalMessageCount: number;
    /** Final message count */
    finalMessageCount: number;
  };
}

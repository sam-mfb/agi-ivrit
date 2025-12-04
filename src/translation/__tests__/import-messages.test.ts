import { describe, it, expect } from 'vitest';
import { importMessages } from '../import-messages.js';
import type { TranslationMessage } from '../types.js';

describe('importMessages', () => {
  it('should apply single translation to logic file', () => {
    const logicContent = `if (f5) {
  print(m1);
}
return();

// messages
#message 1 "Hello World"
`;

    const translations: TranslationMessage[] = [
      {
        logicFile: '0.agilogic',
        messageNumber: 1,
        original: 'Hello World',
        translation: 'שלום עולם',
        notes: '',
        placeholders: []
      }
    ];

    const result = importMessages(logicContent, translations);

    expect(result).toContain('#message 1 "שלום עולם"');
    expect(result).not.toContain('#message 1 "Hello World"');
  });

  it('should apply multiple translations', () => {
    const logicContent = `print(m1);
print(m2);
return();

// messages
#message 1 "First"
#message 2 "Second"
`;

    const translations: TranslationMessage[] = [
      {
        logicFile: '0.agilogic',
        messageNumber: 1,
        original: 'First',
        translation: 'ראשון',
        notes: '',
        placeholders: []
      },
      {
        logicFile: '0.agilogic',
        messageNumber: 2,
        original: 'Second',
        translation: 'שני',
        notes: '',
        placeholders: []
      }
    ];

    const result = importMessages(logicContent, translations);

    expect(result).toContain('#message 1 "ראשון"');
    expect(result).toContain('#message 2 "שני"');
  });

  it('should skip messages with empty translation strings', () => {
    const logicContent = `return();

// messages
#message 1 "Translated"
#message 2 "Not translated"
`;

    const translations: TranslationMessage[] = [
      {
        logicFile: '0.agilogic',
        messageNumber: 1,
        original: 'Translated',
        translation: 'מתורגם',
        notes: '',
        placeholders: []
      },
      {
        logicFile: '0.agilogic',
        messageNumber: 2,
        original: 'Not translated',
        translation: '',  // Empty - should skip
        notes: '',
        placeholders: []
      }
    ];

    const result = importMessages(logicContent, translations);

    expect(result).toContain('#message 1 "מתורגם"');
    expect(result).toContain('#message 2 "Not translated"');  // Unchanged
  });

  it('should preserve placeholders in translations', () => {
    const logicContent = `return();

// messages
#message 1 "You have %v points"
`;

    const translations: TranslationMessage[] = [
      {
        logicFile: '0.agilogic',
        messageNumber: 1,
        original: 'You have %v points',
        translation: 'יש לך %v נקודות',
        notes: '',
        placeholders: ['%v']
      }
    ];

    const result = importMessages(logicContent, translations);

    expect(result).toContain('#message 1 "יש לך %v נקודות"');
  });

  it('should preserve escape sequences in translations', () => {
    const logicContent = `return();

// messages
#message 1 "He said \\\\"hello\\\\""
`;

    const translations: TranslationMessage[] = [
      {
        logicFile: '0.agilogic',
        messageNumber: 1,
        original: 'He said \\"hello\\"',
        translation: 'הוא אמר \\"שלום\\"',
        notes: '',
        placeholders: []
      }
    ];

    const result = importMessages(logicContent, translations);

    // The translation is inserted as-is (translator is responsible for proper escaping)
    expect(result).toContain('#message 1 "הוא אמר \\"שלום\\""');
  });

  it('should preserve logic code before messages section', () => {
    const logicContent = `if (f5) {
  print(m1);
  set.menu(m2);
}

if (said("look")) {
  print(m1);
}

return();

// messages
#message 1 "Test"
#message 2 "Menu"
`;

    const translations: TranslationMessage[] = [
      {
        logicFile: '0.agilogic',
        messageNumber: 1,
        original: 'Test',
        translation: 'בדיקה',
        notes: '',
        placeholders: []
      }
    ];

    const result = importMessages(logicContent, translations);

    // Code should be unchanged
    expect(result).toContain('if (f5) {');
    expect(result).toContain('if (said("look")) {');
    expect(result).toContain('return();');

    // Translation applied
    expect(result).toContain('#message 1 "בדיקה"');
  });

  it('should handle logic files with no translations to apply', () => {
    const logicContent = `print(m1);
return();

// messages
#message 1 "Original"
`;

    const translations: TranslationMessage[] = [
      {
        logicFile: '0.agilogic',
        messageNumber: 1,
        original: 'Original',
        translation: '',  // Empty
        notes: '',
        placeholders: []
      }
    ];

    const result = importMessages(logicContent, translations);

    // Should be unchanged
    expect(result).toBe(logicContent);
  });

  it('should handle non-sequential message numbers', () => {
    const logicContent = `return();

// messages
#message 1 "First"
#message 5 "Fifth"
#message 10 "Tenth"
`;

    const translations: TranslationMessage[] = [
      {
        logicFile: '0.agilogic',
        messageNumber: 5,
        original: 'Fifth',
        translation: 'חמישי',
        notes: '',
        placeholders: []
      }
    ];

    const result = importMessages(logicContent, translations);

    expect(result).toContain('#message 1 "First"');  // Unchanged
    expect(result).toContain('#message 5 "חמישי"');  // Translated
    expect(result).toContain('#message 10 "Tenth"'); // Unchanged
  });

  it('should handle messages with complex placeholders', () => {
    const logicContent = `return();

// messages
#message 1 "I don't understand \\\\\\"%w3\\\\\\""
#message 2 "%m1 and more text"
`;

    const translations: TranslationMessage[] = [
      {
        logicFile: '0.agilogic',
        messageNumber: 1,
        original: 'I don\'t understand \\"%w3\\"',
        translation: 'אני לא מבין את \\"%w3\\"',
        notes: '',
        placeholders: ['%w3']
      },
      {
        logicFile: '0.agilogic',
        messageNumber: 2,
        original: '%m1 and more text',
        translation: '%m1 וטקסט נוסף',
        notes: '',
        placeholders: ['%m1']
      }
    ];

    const result = importMessages(logicContent, translations);

    expect(result).toContain('אני לא מבין את');
    expect(result).toContain('%m1 וטקסט נוסף');
  });
});

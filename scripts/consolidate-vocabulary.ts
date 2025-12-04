#!/usr/bin/env node

import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const translationsDir = '/home/devuser/sq2heb/translations/sq2';

// Read all three translated files
const vocab0_50 = JSON.parse(readFileSync(join(translationsDir, 'vocabulary_0-50_translated.json'), 'utf-8'));
const vocab51_200 = JSON.parse(readFileSync(join(translationsDir, 'vocabulary_51-200_translated.json'), 'utf-8'));
const vocab201_432 = JSON.parse(readFileSync(join(translationsDir, 'vocabulary_201-432_translated.json'), 'utf-8'));

// Combine all translations into a map
const translationMap = new Map<number, string[]>();

for (const entry of [...vocab0_50, ...vocab51_200, ...vocab201_432]) {
  translationMap.set(entry.wordNumber, entry.translatedSynonyms);
}

console.log(`Total translations loaded: ${translationMap.size}`);

// Read the main vocabulary file
const vocabularyFile = JSON.parse(readFileSync(join(translationsDir, 'vocabulary.json'), 'utf-8'));
const vocabulary = vocabularyFile.vocabulary;

console.log(`Total vocabulary entries: ${vocabulary.length}`);

// Update each entry
let updatedCount = 0;
let missingCount = 0;
const missingWords: number[] = [];

for (const entry of vocabulary) {
  const wordNumber = entry.wordNumber;
  const translation = translationMap.get(wordNumber);

  if (translation) {
    entry.translatedSynonyms = translation;
    entry.notes = "";
    updatedCount++;
  } else {
    missingWords.push(wordNumber);
    missingCount++;
  }
}

console.log(`Updated entries: ${updatedCount}`);
console.log(`Missing translations: ${missingCount}`);

if (missingWords.length > 0) {
  console.log(`Missing word numbers: ${missingWords.join(', ')}`);
}

// Write the consolidated vocabulary file
writeFileSync(
  join(translationsDir, 'vocabulary.json'),
  JSON.stringify(vocabularyFile, null, 2) + '\n',
  'utf-8'
);

console.log('\nConsolidation complete! vocabulary.json has been updated.');

import { InventoryObject, ObjectIndexResult } from './object-types.js';

export function indexObjects(
  logicContent: string,
  objects: InventoryObject[]
): ObjectIndexResult {
  let content = logicContent;
  let replacedObjects = 0;

  // Separate code section from messages section
  const messagesSectionStart = content.indexOf('// messages');
  let codeSection = messagesSectionStart !== -1
    ? content.substring(0, messagesSectionStart)
    : content;
  const messagesSection = messagesSectionStart !== -1
    ? content.substring(messagesSectionStart)
    : '';

  // Create a map of object names to their indices
  const objectMap = new Map<string, number>();
  for (const obj of objects) {
    objectMap.set(obj.name, obj.index);
  }

  // Commands that take inventory object references (not message strings)
  // These are the ONLY commands where we should replace object name strings with iN
  const inventoryCommands = [
    'get\\(',          // get(iN) - give object to player
    'get\\.v\\(',      // get.v(varN) - give object (variable)
    'put\\(',          // put(iN) - remove object from player
    'put\\.v\\(',      // put.v(varN) - remove object (variable)
    'drop\\(',         // drop(iN) - drop object in current room
    'drop\\.v\\(',     // drop.v(varN) - drop object (variable)
  ];

  // Create regex to match lines with inventory commands
  const inventoryCommandPattern = new RegExp(inventoryCommands.join('|'));

  // Find all hardcoded strings in inventory commands (except said())
  const lines = codeSection.split('\n');
  const processedLines: string[] = [];

  for (const line of lines) {
    let processedLine = line;

    // Skip said() commands entirely
    if (line.includes('said(')) {
      processedLines.push(line);
      continue;
    }

    // Only process lines that contain inventory commands
    if (!inventoryCommandPattern.test(line)) {
      processedLines.push(line);
      continue;
    }

    // Find all quoted strings in this line
    const stringPattern = /"(?:[^"\\]|\\.)*"/g;
    const matches = line.match(stringPattern);

    if (matches) {
      for (const match of matches) {
        // Remove quotes to get the actual string content
        const quotedString = match;
        const stringContent = match.slice(1, -1); // Remove surrounding quotes

        // Check if this string matches any object name
        // We need to handle escaped quotes in the string
        const unescapedString = stringContent.replace(/\\"/g, '"');

        if (objectMap.has(unescapedString)) {
          const objectIndex = objectMap.get(unescapedString)!;
          const replacement = `i${objectIndex}`;

          // Replace the quoted string with the object reference
          processedLine = processedLine.replace(quotedString, replacement);
          replacedObjects++;
        }
      }
    }

    processedLines.push(processedLine);
  }

  // Reconstruct the content
  codeSection = processedLines.join('\n');
  content = messagesSection ? codeSection + messagesSection : codeSection;

  return {
    content,
    stats: {
      replacedObjects
    }
  };
}

#!/bin/bash
# Extract messages from messages.json and group by logicFile
# Usage: ./extract-messages-by-logic.sh <path-to-messages.json>

if [ -z "$1" ]; then
  echo "Usage: $0 <path-to-messages.json>"
  exit 1
fi

MESSAGES_JSON="$1"
OUTPUT_DIR="./tmp/message_reviews"

if [ ! -f "$MESSAGES_JSON" ]; then
  echo "Error: File not found: $MESSAGES_JSON"
  exit 1
fi

# Clean up output directory before starting
echo "Cleaning output directory: $OUTPUT_DIR"
rm -rf "$OUTPUT_DIR"
mkdir -p "$OUTPUT_DIR"

# Get unique logicFile names
LOGIC_FILES=$(jq -r '.messages[].logicFile | select(. != null)' "$MESSAGES_JSON" | sort -u)

echo "Extracting messages by logicFile..."

# For each logicFile, extract its messages and save to a separate file
while IFS= read -r logic_file; do
  output_file="$OUTPUT_DIR/${logic_file}.json"
  echo "  Extracting: $logic_file -> $output_file"

  jq --arg logicFile "$logic_file" '{
    logicFile: $logicFile,
    messages: [.messages[] | select(.logicFile == $logicFile)]
  }' "$MESSAGES_JSON" > "$output_file"
done <<< "$LOGIC_FILES"

# Count results
total_files=$(echo "$LOGIC_FILES" | wc -l)
echo ""
echo "Extraction complete!"
echo "  Total logicFiles: $total_files"
echo "  Output directory: $OUTPUT_DIR"

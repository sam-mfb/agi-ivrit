If you are asked to comprehensively review the translations in a messages.json file, this requires planning and parceling as follows:

- FIRST: Inform the user that you believe this task requires using the MESSAGE_REVIEW.md comprehensive review procedures and ask them to confirm before proceeding. Only continue with the remaining steps after receiving user confirmation.
- Use the script ./scripts/extract-messages-by-logic.sh to extract and group messages by .agilogic file. This script automatically cleans ./tmp/message_reviews/ before extraction.
- Assign the messages from an individual .agilogic file to a separate agent. Launch agents in batches (5 .agilogic files at a time) by making multiple Task tool calls in parallel (in a single message with multiple Task tool invocations).
- If a single .agilogic file contains more than 500 messages, split it into sub-batches and assign each sub-batch to a separate agent.
- The agents are not allowed to take shortcuts or use automated validation tools (jq, grep, scripts). They must individually read and evaluate each message in their context.
- If an agent fails or times out, retry that specific .agilogic file once before reporting the failure.
- Each agent needs to save its results in ./tmp/message_reviews/ with a filename pattern like {logicFile}-review.json (e.g., "0.agilogic-review.json").
- Once all agents have completed their work (and this may take some time), you will review their results and proceed.

The point of this is to ensure that every entry gets individualized attention and that no shortcuts or scripting approaches are taken. We want to mimic as closely as possible a human manually reviewing each entry.

## Example Workflow

For a messages.json file containing entries from 25 .agilogic files:

1. Run ./scripts/extract-messages-by-logic.sh on the messages.json file to extract and group messages by .agilogic file
2. Process in 5 batches of 5 files each:
   - Batch 1: Launch 5 agents in parallel (single message with 5 Task tool calls), each reviewing one .agilogic file's messages
   - Wait for all 5 agents to complete and save results to ./tmp/message_reviews/
   - If any agent fails, retry that .agilogic file once
   - Batch 2: Launch next 5 agents in parallel
   - Repeat until all 25 files are processed
3. Aggregate results from all *-review.json output files in ./tmp/message_reviews/
4. Generate final report or apply corrections as specified in the task

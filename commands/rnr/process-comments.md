---
name: rnr:process-comments
description: Iterates through each extracted comment and processes the revisions
allowed-tools:
  - Bash
  - Read
  - Write
  - AskUserQuestion
---

<objective>
Iterate through every `COMMENT_<ID>.md` file in `data/`, resolve the requested revisions strictly adhering to `skills/style_skill.md`, and output a `COMMENT_<ID>_RESOLVED.md` file for each.
</objective>

<core_principle>
Orchestrator coordinates, not executes. DO NOT read `skills/style_skill.md`, `.rnr/config.json`, or the `COMMENT_<ID>.md` files into your own context. Your job is to trigger the tools that generate `Task()` strings and execute them. The subagents will read the files themselves using their fresh 200k context.
</core_principle>

<process>
1. Check that you are in the project root.
2. **Classification Phase**: Run the following node script to classify all comments in `data/document_map.json`:
   ```bash
   node .rnr/bin/rnr-tools.js get-grouped-comments
   ```
   *Note: If a classification doesn't exist yet, analyze the `data/document_map.json` yourself and create `data/classification.json` using this schema:*
   `{"isolated": ["ID1", "ID2"], "interlaced": [["ID3", "ID4"], ["ID5", "ID6"]]}`

3. **Execution Phase**:
   Do NOT attempt to loop through the comments yourself. Instead, use the Node.js tool to natively orchestrate and execute the subagents.
   
   Run the following command:
   ```bash
   node .rnr/bin/rnr-tools.js execute-tasks
   ```
   
   Wait for the command to finish completely. The script will handle spawning the subagents dynamically and will print out a status once all isolated and interlaced comments have been processed.
   
4. Confirm to the user when the node script finishes its execution and all comments have a resolved file. Advise them they can run `/rnr:assemble output.docx` when ready.
</process>

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

<process>
1. Check that you are in the project root.
2. Read `skills/style_skill.md` and keep it strictly in mind for all modifications.
3. Read `.rnr/config.json` to get the `notebook_id` if it was configured during `/rnr:init`. Note whether it is null or populated.
4. **Classification Phase**: Run the following node script to classify all comments in `data/document_map.json`:
   ```bash
   node .rnr/bin/rnr-tools.js get-grouped-comments
   ```
   *Note: If a classification doesn't exist yet, analyze the `data/document_map.json` yourself and create `data/classification.json` using this schema:*
   `{"isolated": ["ID1", "ID2"], "interlaced": [["ID3", "ID4"], ["ID5", "ID6"]]}`

5. **Execution Phase**:
   Do NOT attempt to loop through the comments yourself. Instead, use the Node.js tool to generate exactly the `Task()` definitions you must execute.
   
   Run the following command:
   ```bash
   node .rnr/bin/rnr-tools.js generate-prompts
   ```
   
   The script will output a series of `Task(...)` blocks. You MUST literally execute each `Task()` exactly as outputted by the script. 
   
   **CRITICAL RULE**: Do NOT batch them. You must pass the raw `Task(...)` string identically to the framework so it spawns a fresh subagent for each isolated item and each interlaced group. Execute Wave 1 (Isolated) in parallel. When Wave 1 finishes, execute Wave 2 (Interlaced groups).
   
6. Confirm to the user when all comments have a resolved file. Advise them they can run `/rnr:assemble output.docx` when ready.
</process>

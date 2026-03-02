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
   Do NOT attempt to loop through the comments yourself. Instead, use the Node.js tool to generate exactly the `Task()` definitions you must execute.
   
   Run the following command:
   ```bash
   node .rnr/bin/rnr-tools.js generate-prompts
   ```
   
   The script will output a series of `Task(...)` blocks. You MUST literally execute each `Task()` exactly as outputted by the script. 
   
   **CRITICAL RULE**: Do NOT batch them. You must pass the raw `Task(...)` string identically to the framework so it spawns a fresh subagent for each isolated item and each interlaced group. Execute Wave 1 (Isolated) in parallel. When Wave 1 finishes, execute Wave 2 (Interlaced groups).
   
4. Confirm to the user when all comments have a resolved file. Advise them they can run `/rnr:assemble output.docx` when ready.
</process>

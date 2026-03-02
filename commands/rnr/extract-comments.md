---
name: rnr:extract-comments
description: Unpacks the .docx into XML and extracts Reviewer comments
argument-hint: "<file> [reviewer]"
allowed-tools:
  - Bash
  - Read
  - AskUserQuestion
---

<objective>
Run the Python script `.rnr/src/parser.py` on the provided `.docx` file to extract its embedded reviewer comments and map them to their corresponding text blocks.
</objective>

<process>
1. Check if the `.rnr/bin/rnr-tools.js` script exists. If it does not, politely ask the user to run `/rnr:init` first to install the framework to the working directory, and halt.
2. Check if the provided file path exists. If not, ask the user to provide a valid path.
3. Check if the reviewer name was provided as an argument. If not, ask the user for the name of the reviewer whose comments and edit suggestions should be extracted.
4. If the file exists and the reviewer name is known, run the following command to generate the subagent context:
   ```bash
   node .rnr/bin/rnr-tools.js generate-extract-task {file} "{reviewer}"
   ```
5. Do NOT execute the python script directly. Execute the literal `Task(...)` string outputted by the node command exactly as written. This will spawn the `rnr-extractor` subagent which isolates the execution.
6. Once the subagent finishes and returns the output to you, read the extracted metadata in `data/document_map.json`.
7. Output a brief, user-friendly summary of how many comments were found and extracted.
8. Remind the user they can now run `/rnr:synthesize-style` or proceed straight to `/rnr:process-comments`.
</process>

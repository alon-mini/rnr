---
name: rnr:assemble
description: Repacks XML into a fully valid, formatted .docx
argument-hint: "<output_file> [--fresh]"
allowed-tools:
  - Bash
  - Read
---

<objective>
Run the Python script `.rnr/src/assembler.py` to inject the resolved comments back into the raw XML and repack the `.docx` file.
</objective>

<process>
1. Check if the `.rnr/bin/rnr-tools.js` script exists. If it does not, prompt the user to run `/rnr:init` first.
2. Determine the path of the original `.docx` file. You can usually find this by checking `tests/` or asking the user if it isn't obvious in the working directory.
3. Determine the requested output file name (e.g., `manuscript_revised.docx`).
4. Run the following node command to generate the subagent context:
   ```bash
   node .rnr/bin/rnr-tools.js generate-assemble-task <original_path> <output_path>
   ```
5. Do NOT execute the python script directly. Execute the literal `Task(...)` string outputted by the node command exactly as written. This will spawn the `rnr-assembler` subagent which isolates the assembly execution and reporting.
6. Report the assembler's success to the user.
</process>

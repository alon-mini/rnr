---
name: rnr:synthesize-style
description: Synthesizes the author's writing style from the document
allowed-tools:
  - Bash
  - Read
  - Write
---

<objective>
Analyze the parsed document text to create a comprehensive `skills/style_skill.md`. This file captures the author's unique voice, terminology, and citation style, and will be used as the ultimate formatting rulebook for all future revisions.
</objective>

<process>
1. Make sure you are in the project root. Check that `data/document_map.json` exists. If it does not, remind the user to run `/rnr:extract-comments` first.
2. Run the following command to launch the synthesizer subagent:
   ```bash
   node .rnr/bin/rnr-tools.js execute-synthesizer
   ```
3. Wait for the command to finish. Do NOT attempt to read `document_map.json` yourself or synthesize the style manually. The background subagent will handle the heavy lifting to keep your context footprint small.
4. Once the node script finishes, verify `skills/style_skill.md` was created.
5. Confirm to the user that the style has been synthesized and saved.
</process>

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
1. Check that you are in the project root. Read `data/document_map.json` to get the list of comments.
2. Read `skills/style_skill.md` and keep it strictly in mind for all modifications.
3. Read `.rnr/config.json` to get the `notebook_id` if it was configured during `/rnr:init`. Note whether it is null or populated.
4. **Classification Phase**: Analyze all the comments in `data/document_map.json`. Categorize them into two distinct lists:
   - **Isolated**: Comments that can be resolved completely independently without affecting other comments (e.g., isolated typos, standalone factual additions).
   - **Interlaced Groups**: Sets of 2 or more comments that are related to the same subject matter, overlap in text, or depend on each other (e.g., "move this here" + "delete this sentence in the moved paragraph"). Create specific groupings (e.g., Group A: Comments 1 & 2; Group B: Comments 4, 5, & 6).

5. **Isolated Processing Phase**:
   For each **Isolated** comment:
   a. Check if `data/COMMENT_<ID>_RESOLVED.md` already exists. If it does, skip it.
   b. Execute a fresh, isolated Claude Code subagent to handle this specific comment. You MUST spawn exactly one new `claude` process via Bash per isolated comment:
      ```bash
      claude -p "Resolve the isolated comment in data/COMMENT_<ID>.md. You must adhere strictly to the author's conventions in skills/style_skill.md. 
      Rules:
      1. Use NotebookLM ({notebook_id}) for external research if needed.
      2. Draft the exact revised text block that will replace the original text in the document. You MUST execute the revision yourself. Do NOT output manual instructions.
      3. If the comment is vague or explicitly non-actionable as-is, you MUST use the AskUserQuestion tool to elaborate and converse with the user until the comment becomes actionable BEFORE you output the RESOLVED.md file.
      4. Draft a strict, swift revision note (1 sentence maximum) replying to the reviewer stating what was done.
      5. Save your output to data/COMMENT_<ID>_RESOLVED.md using strictly this XML format:
         <revised_text>
         [The exact revised text block]
         </revised_text>
         <reviewer_reply>
         [The drafted reply]
         </reviewer_reply>
      "
      ```
   c. You may run these bash commands in parallel if your tools allow. Wait for them to finish.

6. **Interlaced Processing Phase**:
   For each **Interlaced Group**:
   a. Check if the `RESOLVED.md` files for all comments in this group already exist. If so, skip.
   b. Execute a single fresh Claude Code subagent to handle all comments in this specific group together, passing all their file paths:
      ```bash
      claude -p "Resolve the following related comments together to ensure consistency: data/COMMENT_<ID1>.md, data/COMMENT_<ID2>.md, etc. You must adhere strictly to skills/style_skill.md.
      Rules:
      1. Use NotebookLM ({notebook_id}) for external research if needed.
      2. Review how these comments relate to each other and draft the exact revised text blocks for each. You MUST execute the revisions yourself. 
      3. If any comment is vague, use AskUserQuestion to clarify with the user first.
      4. Draft a strict, swift revision note (1 sentence maximum) for each comment.
      5. Save your output by creating a separate data/COMMENT_<ID>_RESOLVED.md file for EACH comment in your group, using strictly this XML format in each file:
         <revised_text>
         [The exact revised text block]
         </revised_text>
         <reviewer_reply>
         [The drafted reply]
         </reviewer_reply>
      "
      ```
   c. Wait for this group's subagent to finish before moving to the next Interlaced Group.

7. Confirm to the user when all comments have a resolved file. Advise them they can run `/rnr:assemble output.docx` when ready.
</process>

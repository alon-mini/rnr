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
3. Check if the user has provided a target NotebookLM notebook ID/URL for research. If not, use `AskUserQuestion` to ask: "If any comments require external research, which NotebookLM notebook ID or URL should I connect the MCP to? (Reply 'none' to skip)". Store this answer.
4. For each comment listed in `data/document_map.json`:
   a. Check if `data/COMMENT_<ID>_RESOLVED.md` already exists. If it does, skip to the next comment.
   b. Execute a fresh, isolated Claude Code subagent to handle this specific comment. You MUST spawn a new `claude` process via Bash for EACH comment to guarantee zero context bleeding:
      ```bash
      claude -p "Resolve the comment in data/COMMENT_<ID>.md. You must adhere strictly to the author's conventions in skills/style_skill.md. 
      Rules:
      1. If the comment requires external data or context (like summarizing a paper or checking facts), you must use your MCP tools (specifically notebooklm or notebooklm-mcp-cli) to research the answer from the user's notebook at: {notebook_id}.
      2. Draft a revised text block.
      3. Draft a strict, swift revision note (1 sentence maximum, 2 only if absolutely necessary) replying to the reviewer stating what was done. It must not be too formal.
      4. Save your output to data/COMMENT_<ID>_RESOLVED.md using strictly this XML format:
         <revised_text>
         [The revised text block]
         </revised_text>
         <reviewer_reply>
         [The drafted reply]
         </reviewer_reply>
      "
      ```
   c. Wait for the subagent bash command to finish. Verify the `RESOLVED.md` file was created before moving to the next comment in the loop.
5. Confirm to the user when all comments have a resolved file. Advise them they can run `/rnr:assemble output.docx` when ready.
</process>

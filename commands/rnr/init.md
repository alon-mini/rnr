---
name: rnr:init
description: Initializes the R&R Framework in the current directory by copying required scripts.
allowed-tools:
  - Bash
---

<objective>
Find the original R&R installation directory and copy its `src/` folder into a hidden `.rnr/` directory in the current working directory. This ensures the parser and assembler scripts are available to the local Claude Code subagents.
</objective>

<process>
1. Ask the user for the path to the cloned `rnr` repository if it isn't obvious. You can also try searching common locations like `~/Documents/rnr`, `~/rnr`, or checking if the commands in `~/.claude/commands/rnr` have symlinks you can trace.
2. Once the R&R source directory is known, run a bash command to create a `.rnr` directory in the current working directory: `mkdir -p .rnr`
3. Run bash commands to copy the `src/` and `bin/` directories from the R&R source to the `.rnr/` folder: `cp -r <rnr_path>/src .rnr/` and `cp -r <rnr_path>/bin .rnr/`
4. Copy the package.json file to the `.rnr/` directory: `cp <rnr_path>/package.json .rnr/`
5. Run `npm install` inside the `.rnr/` directory to install required dependencies (like `cross-spawn`): `cd .rnr && npm install`
6. Use the `AskUserQuestion` tool to ask if they want to connect a NotebookLM notebook to this project. Ask them to provide the notebook ID or URL, or reply "none" to skip.
5. If they provide an ID or URL, extract the ID and write it to `.rnr/config.json` like this: `{"notebook_id": "the_id"}`.
6. If they provided an ID, use bash to execute: `claude mcp add notebooklm notebooklm-mcp-cli` to ensure the server is configured. If they reply "none", write `{"notebook_id": null}`.
8. If an ID was provided and the MCP server was added, perform a test query to verify the connection is active. Spawn a test subagent locally or use the appropriate MCP tool to simply ask the given NotebookLM ID: "What is the title of this notebook?".
   - *If the test query succeeds:* Report to the user that NotebookLM is successfully connected.
   - *If the test query fails:* Warn the user that the NotebookLM connection failed, and they may need to authenticate or troubleshoot their MCP setup.
9. Verify that `.rnr/src/parser.py` exists using bash.
10. Report success to the user and politely remind them to add `.rnr` to their `.gitignore` file. Let them know they can now run `/rnr:extract-comments`.
</process>

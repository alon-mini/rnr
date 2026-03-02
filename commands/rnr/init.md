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
3. Run a bash command to copy the `src/` directory from the R&R source to the `.rnr/` folder: `cp -r <rnr_path>/src .rnr/`
4. Verify that `.rnr/src/parser.py` exists using bash.
5. Report success to the user and politely remind them to add `.rnr` to their `.gitignore` file. Let them know they can now run `/rnr:extract-comments`.
</process>

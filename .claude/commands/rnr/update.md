---
name: rnr:update
description: Updates the R&R Framework to the latest version from GitHub
allowed-tools:
  - Bash
---

<objective>
Run the Node.js update script `bin/update.js` located in the R&R installation directory to pull the latest updates from GitHub and immediately sync the new Claude commands.
</objective>

<process>
1. Determine the path to the R&R installation directory (the folder where `bin/update.js` exists). Use `Bash` to `find` or `locate` `bin/update.js` if it isn't obvious, starting from the current directory or `~/.claude/commands/rnr` context.
2. Once the R&R source directory is known, execute the script via bash: `node /path/to/rnr/bin/update.js`.
3. Report success or display any terminal errors to the user.
</process>

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
1. Determine the path to the R&R installation directory. **CRITICAL: Do NOT use `find` or `locate` commands to search the hard drive as it is too slow.** 
   Instead, use `Bash` to run `npm root -g` to get the global Node modules directory. 
   Check if the update script exists at `<npm_global_root>/revise-and-resubmit-cc/bin/update.js`.
   If it doesn't, check if it exists in the current working directory at `./bin/update.js`.
2. Once the script path is found, execute it via bash: `node <path_to_update.js>`.
3. Report success or display any terminal errors to the user.
</process>

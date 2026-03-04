---
name: rnr:health-check
description: Check the health and progress of background comment processors
allowed-tools:
  - Bash
  - Read
---

<objective>
Check the status of the background comment processor orchestration and take corrective action if it has stalled or failed.
</objective>

<process>
1. Run the health check via bash:
```bash
node .rnr/bin/rnr-tools.js health-check
```

2. Review the output. If the health check reports `[FAILED]` and says there are still unprocessed comments, then the process has stalled. You must automatically resume it by executing:
```bash
node .rnr/bin/rnr-tools.js execute-tasks
```

3. Report the current status, progress, and any time estimates back to the user.
</process>

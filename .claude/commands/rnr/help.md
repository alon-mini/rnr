---
name: rnr:help
description: Show all commands and usage guide
allowed-tools:
  - Read
---

<objective>
Provide the user with a helpful overview of the R&R commands and workflow.
</objective>

<process>
1. Briefly parse the `README.md` in the root of the project to understand the context.
2. Explain the 4-step workflow to the user clearly:
   **1. Extraction** (`/rnr:extract-comments <file>`)
   **2. Synthesis** (`/rnr:synthesize-style`)
   **3. Processing** (`/rnr:process-comments`)
   **4. Assembly** (`/rnr:assemble <output_file>`)
3. Ask the user if they'd like you to start the extraction step.
</process>

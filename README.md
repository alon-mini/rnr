<div align="center">

# REVISE & RESUBMIT (R&R)

**A light-weight and powerful meta-prompting and context engineering system for automating academic revisions directly inside Claude Code.**

**Solves formatting rot — the style degradation and context loss that happens when LLMs edit complex academic documents.**

[![npm version](https://img.shields.io/npm/v/revise-and-resubmit-cc?style=for-the-badge&logo=npm&logoColor=white&color=CB3837)](#)
[![License](https://img.shields.io/badge/license-MIT-blue?style=for-the-badge)](LICENSE)

<br>

```bash
node bin/install.js --claude --local
```

**Works on Mac, Windows, and Linux.**

<br>

# Revise & Resubmit (R&R) Framework
*An automated, agent-based academic revision ecosystem powered by Claude Code.*

## What is R&R?
When you submit an academic paper, peer reviewers often send back a Microsoft Word `.docx` file filled with dozens (or hundreds) of comments and edit suggestions. 

Manually going through every comment, finding the context, researching the change, negotiating with the reviewer, and rewriting the text can take weeks. 

**Revise & Resubmit (R&R)** is a custom `get-shit-done` style framework for Claude Code that automates this entire process. You simply point R&R at the `.docx` file, and a specialized team of AI "subagents" will extract the comments, edit the manuscript based on your personal writing style, research external data if needed, ask you clarifying questions, and quickly repack a finished `.docx` file ready for submission.

---

## How It Works: The Subagent Ecosystem (In Layman's Terms)

R&R doesn't just use one massive AI that tries to do everything at once (which usually leads to the AI getting confused, skipping comments, or making things up). 

Instead, it relies on a **Subagent Ecosystem**—a highly specialized team of mini-AIs where each agent has exactly one precise job. 

Here is the assembly line:

### 1. The Extractors & Assemblers
*   **The Extractor:** When you run `/rnr:extract-comments`, R&R spawns a specialized python-runner agent. Its only job is to silently open your `.docx`, find every single Reviewer comment and Edit Suggestion, extract the exact paragraph they attached it to, and save them as individual files (e.g., `COMMENT_1.md`, `COMMENT_2.md`).
*   **The Assembler:** At the very end, when you run `/rnr:assemble`, a new dedicated agent takes all the revised paragraphs and perfectly injects them back into a clean, formatted `.docx` file without messing up your citations or graphs.

### 2. The Processors (The Heavy Lifters)
When you tell R&R to get to work (`/rnr:process-comments`), it looks at the extracted files and sorts them:
*   **Isolated Comments:** Typos or localized changes that don't affect anything else. R&R spawns one **Fresh Processor Agent** for *each* isolated comment simultaneously. 
*   **Interlaced Comments:** If a reviewer says "move this here" in comment 4, and "delete this" in comment 5, R&R groups them. It assigns one **Dedicated Processor Agent** to handle that specific group together so the edits make sense.

*Crucially, Processor Agents do NOT talk to you, and they do NOT search the internet. They only look at the comment, look at your style guide, and rewrite the text.*

### 3. The Delegates (The Specialists)
If a Processor Agent encounters a problem it can't solve by just rewriting text, it asks for help from the specialists:
*   **The Researcher:** If the reviewer asks "Can you add a citation for this claim?", the Processor stops and spawns a **Researcher Agent**. The Researcher silently connects to your Google NotebookLM (containing all your PDFs and research), finds the exact answer, and hands it back to the Processor to write the revision.
*   **The Clarifier:** If the reviewer leaves a vague comment like "I don't like this," the Processor stops and spawns a **Clarifier Agent**. The Clarifier will pop up in your terminal, explain the ambiguity, and chat with you to figure out what you want to do. Once you decide, the Clarifier hands your instruction back to the Processor to execute the edit.

---

## Getting Started

### Prerequisites
1.  You must have **Claude Code** installed.
2.  Your terminal must be running in the folder where your manuscript `.docx` is located.
3.  *(Highly Recommended)* Install the NotebookLM MCP tool so R&R can do automated research:
    `claude mcp add notebooklm notebooklm-mcp-cli`

### Installation
Clone this repository to your machine. Then, in your terminal, run:
```bash
node /path/to/rnr/bin/install.js
```
This registers the R&R commands with Claude Code.

### Step 1: Initialize the Project
Navigate to the directory containing your `.docx` manuscript and run:
```bash
/rnr:init
```
This sets up the hidden environment (`.rnr/`) that allows the Subagents to run perfectly isolated scripts. It will also ask you to link a specific NotebookLM notebook so the **Researcher Agents** know where to look.

### Step 2: Extract the Comments
Extract the reviewer comments and map them to the document:
```bash
/rnr:extract-comments manuscript.docx "Reviewer 1"
```

### Step 3: Define Your Style
Ensure the AI edits sound exactly like you:
```bash
/rnr:synthesize-style
```
This crawls your manuscript to map your tone, vocabulary, and sentence structures.

### Step 4: Unleash the Ecosystem
Start the automated revision factory:
```bash
/rnr:process-comments
```
Grab a coffee. The subagents will negotiate, research, and edit every comment asynchronously. If they need you, the **Clarifier** will ping you in the terminal.

### Step 5: Assemble the Final Document
Once processing is complete, repack the manuscript:
```bash
/rnr:assemble final_manuscript.docx
```
Your paper is now ready to resubmit!

---

### 5. Assemble Final Document

```
/rnr:assemble output_revised.docx
```

The system:

1. **Validates** — Ensures all XML nodes are closed.
2. **Injects** — Adds the drafted "Response to Reviewers" as nested comments in the document.
3. **Packs** — Flawlessly recompiles the `.docx`.

Walk away, come back to a completed revision.

---

## Why It Works

### Context Engineering

Claude Code is incredibly powerful *if* you give it the context it needs. Most people don't.

R&R handles it for you:

| File | What it does |
|------|--------------|
| `style_skill.md` | Your exact writing tone and grammar rules |
| `COMMENT_{ID}.md` | The isolated reviewer request and isolated paragraph |
| `COMMENT_{ID}_RESOLVED.md` | XML output of the fix to be injected back |

Size limits based on where Claude's quality degrades. Stay under, get consistent excellence.

### XML Prompt Formatting

Every agent is structured XML optimized for Claude:

```xml
<classification type="needs_context">
  <reasoning>The reviewer asks us to cite the 2023 review by Johnson et al. We need human input.</reasoning>
  <prompt_for_human>Please provide the full citation and a brief summary for Johnson et al. 2023.</prompt_for_human>
</classification>
```

Precise instructions. No guessing.

### Dedicated Python Tools

R&R hooks directly into Anthropic's validated `unpack.py` and `pack.py` python toolkit via `/bash`. This is how it guarantees it will not destroy your page margins or tables when modifying the `.docx` text.

---

## Commands

### Core Workflow

| Command | What it does |
|---------|--------------|
| `/rnr:init` | Installs the parser and assembler scripts to a `.rnr/` folder in the current directory |
| `/rnr:extract-comments <file>` | Unpacks the `.docx` into XML and extracts Reviewer 1/2 comments |
| `/rnr:synthesize-style` | Constructs `style_skill.md` from your writing |
| `/rnr:process-comments` | Iterates through each comment, prompting for human context when needed |
| `/rnr:assemble <output>` | Repacks XML into a fully valid, formatted `.docx` |

### Utilities

| Command | What it does |
|---------|--------------|
| `/rnr:help` | Show all commands and usage guide |
| `/rnr:update` | Updates the framework and scripts to the latest version via `git pull` |

### Updating from Version 1

If you installed the framework before the `/rnr:update` command existed, you must manually fetch the new updates once to activate the auto-updater. Simply run:

```bash
cd rnr
git pull origin main
node bin/install.js --claude --global
```
You can now use `/rnr:update` inside Claude Code going forward.

---

## Security

### Protecting Your Manuscript

Since R&R is entirely open source and relies strictly on your local Anthropic API and Claude Code environment, your manuscript is never uploaded to third-party databases (like ChatGPT's training pipeline) beyond the standard Anthropic backend.

---

## License

MIT License. See [LICENSE](LICENSE) for details.

---

<div align="center">

**Claude Code is powerful. R&R makes it academic.**

</div>

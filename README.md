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

*"If you have reviewer comments embedded in a docx, this WILL resolve them and output a perfectly formatted document. No bs."*

<br>

[Why I Built This](#why-i-built-this) · [How It Works](#how-it-works) · [Commands](#commands) · [Why It Works](#why-it-works)

</div>

---

## Why I Built This

I'm an academic. I don't want to spend 40 hours manually executing "Reviewer 2's" pedantic formatting and re-wording requests — Claude should do it.

Other RAG pipelines and LLM tools exist for writing papers. But they all seem to destroy your formatting, lose your tracked changes, or hallucinate a completely different authorial voice. I'm not looking for an AI to write my paper from scratch. I'm just an author trying to get my paper accepted without losing my sanity.

So I built R&R. The complexity is in the system, not in your workflow. Behind the scenes: raw XML unpacking, strictly constrained subagent orchestration, and context isolation. What you see: a few custom Claude commands that just work.

The system gives Claude exactly one comment and one paragraph at a time, strictly enforcing your synthesized writing style. It just does a good job.

That's what this is. No complex Python LangChain pipelines. Just an incredibly effective system for resolving academic comments consistently using Claude Code.

— **Alon**

---

LLM text editing has a bad reputation. You upload a `.docx`, ask for a revision, and you get back a document with completely destroyed margins, missing citations, and an AI-sounding tone.

R&R fixes that. It's the context engineering layer that makes Claude Code a reliable editor. It unpacks the raw XML, isolates the exact comment, and lets Claude Code execute surgical strikes.

---

## Who This Is For

Academics and researchers who want to resolve inline Reviewer Comments on `.docx` files automatically, while flawlessly preserving their original formatting, tables, and tracking data.

---

## Getting Started

Clone the repository to your machine (you can keep this folder anywhere):

```bash
git clone https://github.com/alon-mini/rnr.git
cd rnr
# Install dependencies for the XML tools and NotebookLM MCP
pip install python-docx anthropic lxml pydantic docx-comments defusedxml notebooklm-mcp-cli
```

### Option 1: Global Installation (Recommended)

Install the R&R commands into your global Claude Code configuration (`~/.claude/`). This makes the `/rnr:*` commands available in **every project** on your computer.

```bash
node bin/install.js --claude --global
```

### Option 2: Local Installation

Install the R&R commands only into the current directory's `.claude/` folder. This is useful if you only want the framework available when working inside this specific folder.

```bash
node bin/install.js --claude --local
```

Verify the installation by opening Claude Code and typing:
- `/rnr:help`

### Recommended: NotebookLM Integration

R&R supports automated research for answering reviewer comments using your own data in NotebookLM. 
To enable this, install and configure the [notebooklm-mcp-cli](https://github.com/jacob-bd/notebooklm-mcp-cli) directly in Claude Code. Once installed, R&R subagents will automatically use it to look up empirical data, citations, or context whenever a reviewer asks a question they don't have the answer to.

### Recommended: Skip Permissions Mode

R&R relies heavily on executing `<bash>` commands to run its Python-based `unpack.py` and `pack.py` DOCX toolkit. Run Claude Code with:

```bash
claude --dangerously-skip-permissions
```

> [!TIP]
> This is how R&R is intended to be used — stopping to approve `python src/parser.py` 50 times defeats the purpose.

---

## How It Works

### 1. Initialize Working Directory

```
/rnr:init
```

R&R relies on strictly deterministic Python scripts to parse and assemble Word documents (to avoid AI hallucination and formatting rot). This command locates your R&R installation and copies `src/parser.py` and `src/assembler.py` into a hidden `.rnr/` folder in your current directory.

**Creates:** `.rnr/src/`

---

### 2. Extract Comments & Target Text

```
/rnr:extract-comments document.docx [reviewer_name]
```

One command. The system:

1. **Unpacks** — Uses Anthropic's DOCX skill scripts to securely extract the raw XML without corrupting styles.
2. **Parses** — Generates a series of Markdown files for every inline comment and **edit suggestion** made by the reviewer.
3. **Isolates** — Locates the exact paragraph of text the comment highlights.

**Creates:** `unpacked/`, `data/document_map.json`, `data/COMMENT_{ID}.md`

---

### 3. Synthesize Style

```
/rnr:synthesize-style
```

**This is what prevents the AI from sounding like an AI.**

The system analyzes your pre-extracted text and identifies your specific authorial traits:

- **Visual features** → Formatting of your citations (APA, IEEE, etc.)
- **Tone** → Lexicon, sentence length, transition preferences.

The output — `style_skill.md` — feeds directly into every single revision worker execution.

**Creates:** `skills/style_skill.md`

---

### 4. Orchestrate Revisions

```
/rnr:process-comments
```

The system loops through every single extracted comment:

1. **Classifies** — An agent decides if the comment requires external data (e.g., "Add a citation from Smith 2023"). If so, it throws a human checkpoint and asks you to provide the PDF or context. The agent will also converse with you to clarify any vague or non-actionable comments.
2. **Executes** — A fresh context window is initialized with your `style_skill.md` and the singular isolated comment. The agent directly applies edit suggestions or drafts new text perfectly matching your style.
3. **Replies** — Synthesizes a drafted response for your "Response to Reviewers" letter.

Each fix is entirely independent. No context degradation.

**Creates:** `data/COMMENT_{ID}_RESOLVED.md`

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

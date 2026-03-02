---
name: rnr:extract-comments
description: Unpacks the .docx into XML and extracts Reviewer comments
argument-hint: "<file> [reviewer]"
allowed-tools:
  - Bash
  - Read
  - AskUserQuestion
---

<objective>
Run the Python script `.rnr/src/parser.py` on the provided `.docx` file to extract its embedded reviewer comments and map them to their corresponding text blocks.
</objective>

<process>
1. Check if the `.rnr/src/parser.py` file exists. If it does not, politely ask the user to run `/rnr:init` first to install the framework to the working directory, and halt.
2. Check if the provided file path exists. If not, ask the user to provide a valid path.
3. Check if the reviewer name was provided as an argument. If not, ask the user for the name of the reviewer whose comments and edit suggestions should be extracted.
4. If the file exists and the reviewer name is known, run the following bash command (assuming you are in the project root):
   `python .rnr/src/parser.py {file} --reviewer "{reviewer}"`
5. The script will output to the `data/` directory. Read the extracted metadata in `data/document_map.json`.
6. Output a brief, user-friendly summary of how many comments were found and extracted.
7. Remind the user they can now run `/rnr:synthesize-style` or proceed straight to `/rnr:process-comments`.
</process>

---
name: rnr:assemble
description: Repacks XML into a fully valid, formatted .docx
argument-hint: "<output_file>"
allowed-tools:
  - Bash
  - Read
---

<objective>
Run the Python script `src/assembler.py` to inject the resolved comments back into the raw XML and repack the `.docx` file.
</objective>

<process>
1. Determine the path of the original `.docx` file. You can usually find this by checking `tests/` or asking the user if it isn't obvious in the working directory.
2. Determine the requested output file name (e.g., `manuscript_revised.docx`).
3. Run the following bash command:
   `python src/assembler.py <original_path> <output_path>`
4. The Python script will dynamically edit `unpacked/word/document.xml` mapping the replies, and run the Anthropic `pack.py` utility.
5. Report success or display any terminal errors.
</process>

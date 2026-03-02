---
name: rnr:synthesize-style
description: Synthesizes the author's writing style from the document
allowed-tools:
  - Bash
  - Read
  - Write
---

<objective>
Analyze the parsed document text to create a comprehensive `skills/style_skill.md`. This file captures the author's unique voice, terminology, and citation style, and will be used as the ultimate formatting rulebook for all future revisions.
</objective>

<process>
1. Make sure you are in the project root. Read the `data/document_map.json` and optionally peek inside `unpacked/word/document.xml` to gather a large enough sample of the original author's written text (e.g., the first 500 words).
2. Deeply analyze the text for the following elements:
   - **Tone & Voice**: Is it formal, conversational, dense, accessible, objective, or persuasive?
   - **Vocabulary**: Notice any specific terminology, jargon, or recurring phrases. Are they using British or American spelling?
   - **Sentence Structure**: Does the author prefer long complex sentences, or short punchy ones? Active or passive voice?
   - **Transitions & Flow**: How does the author connect ideas between paragraphs and sentences?
   - **Citation Style**: Analyze the in-text citations. Are they APA (Author, Year), IEEE [1], Chicago footnotes, etc.? Detail the exact formatting rules including punctuation around citations.
3. Produce a meticulously structured markdown file and save it to `skills/style_skill.md`.
4. The markdown file MUST contain explicit instructions for an AI to follow when writing new text, formatted elegantly with sections for Voice, Vocabulary, Structure, and Citations.
5. Confirm to the user that the style has been synthesized and saved.
</process>

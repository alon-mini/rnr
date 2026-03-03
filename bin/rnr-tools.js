#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const command = process.argv[2];

if (command === 'get-grouped-comments') {
    const mapPath = path.join(process.cwd(), 'data', 'document_map.json');
    if (!fs.existsSync(mapPath)) {
        console.error('Document map not found.');
        process.exit(1);
    }

    const comments = JSON.parse(fs.readFileSync(mapPath, 'utf8'));

    // Very naive grouping for demonstration - in reality this would be better defined
    // For the sake of matching the user's issue, we will just randomly group them 
    // into interlaced and isolated for testing purposes.
    // In a robust implementation, the user/agent would have defined these groupings prior.

    const isolated = [];
    const interlacedGroups = [];

    // Example grouping logic based on proximity or target text overlap
    // Since we don't have the full text, we will just simulate finding groups
    // by grouping comments from the same author that are adjacent in ID, or just
    // pass them back for the agent to classify.

    // A better approach for the script: Let the agent classify them FIRST, save to a file,
    // then the script reads the classification and outputs the subagent spawning instructions.

    const classificationPath = path.join(process.cwd(), 'data', 'classification.json');
    if (fs.existsSync(classificationPath)) {
        const classifications = JSON.parse(fs.readFileSync(classificationPath, 'utf8'));
        console.log(JSON.stringify(classifications, null, 2));
    } else {
        console.error('Classification file not found. Please run the classification phase first.');
        process.exit(1);
    }
}

if (command === 'generate-extract-task') {
    const targetFile = process.argv[3];
    const reviewer = process.argv[4] ? ` --reviewer "${process.argv[4]}"` : '';

    if (!targetFile) {
        console.error('Missing target file for extraction.');
        process.exit(1);
    }

    console.log(`Task(
  subagent_type="rnr-extractor",
  model="claude-3-haiku-20240307",
  prompt="Execute the comment extraction tool. Run this exact bash command: \\"python .rnr/src/parser.py ${targetFile}${reviewer}\\". Report the output back to me."
)`);
    process.exit(0);
}

if (command === 'generate-assemble-task') {
    const originalFile = process.argv[3];
    const outputFile = process.argv[4] || 'output.docx';

    if (!originalFile) {
        console.error('Missing original file path for assembly.');
        process.exit(1);
    }

    console.log(`Task(
  subagent_type="rnr-assembler",
  model="claude-3-haiku-20240307",
  prompt="Execute the document assembly tool. Run this exact bash command: \\"python .rnr/src/assembler.py ${originalFile} ${outputFile}\\". Report the outcome."
)`);
    process.exit(0);
}

if (command === 'execute-tasks') {
    // Execute the tasks natively using child_process
    const classificationPath = path.join(process.cwd(), 'data', 'classification.json');
    if (!fs.existsSync(classificationPath)) {
        console.error('Classification file not found.');
        process.exit(1);
    }

    const configPath = path.join(process.cwd(), '.rnr', 'config.json');
    let notebookId = 'none';
    if (fs.existsSync(configPath)) {
        try {
            notebookId = JSON.parse(fs.readFileSync(configPath, 'utf8')).notebook_id || 'none';
        } catch (e) { }
    }

    const classifications = JSON.parse(fs.readFileSync(classificationPath, 'utf8'));

    // Helper function to safely escape quotes for bash
    const executeAgent = (taskString) => {
        // We use npx @anthropic-ai/claude-code with -p flag
        const escapedPrompt = taskString.replace(/"/g, '\\"').replace(/\n/g, ' ');
        try {
            // Using stdio: 'pipe' to suppress loud output from clogging the main orchestrator's context.
            // We just let it run and catch any errors.
            execSync(`npx @anthropic-ai/claude-code -p "${escapedPrompt}"`, { stdio: 'pipe' });
            return true;
        } catch (error) {
            console.error(`Error executing subagent: ${error.message}`);
            return false;
        }
    };

    console.log(`\n### Executing Tasks via Node Orchestrator ###\n`);

    // Wave 1: Isolated
    if (classifications.isolated && classifications.isolated.length > 0) {
        console.log(`\n#### Wave 1: Executing Isolated Comments ####\n`);
        classifications.isolated.forEach(id => {
            const resolvedPath = path.join(process.cwd(), 'data', `COMMENT_${id}_RESOLVED.md`);
            if (fs.existsSync(resolvedPath)) {
                console.log(`✅ COMMENT_${id} already resolved. Skipping.`);
                return;
            }

            console.log(`⏳ Spawning subagent for COMMENT_${id}...`);
            const taskStr = `Task(
  subagent_type="rnr-processor-isolated",
  model="claude-3-7-sonnet-20250219",
  prompt="
  <objective>
  Resolve the isolated comment. You must adhere strictly to the author's conventions in skills/style_skill.md.
  </objective>
  
  <files_to_read>
  Read these files at execution start using the Read tool:
  - skills/style_skill.md
  - data/COMMENT_${id}.md
  </files_to_read>
  
  <rules>
  1. DO NOT use NotebookLM or ask the user questions directly. If you need external research context, you MUST spawn this exact subagent to get it: Task(subagent_type=\\"rnr-researcher\\", prompt=\\"Query notebook ${notebookId} for: [Your concise question]\\")
  2. If the comment is vague or explicitly non-actionable as-is, you MUST spawn this exact subagent to negotiate it: Task(subagent_type=\\"rnr-clarifier\\", prompt=\\"Present this ambiguity to the user and ask how they want to proceed: [The context]\\"). Wait for its return string.
  3. Draft the exact revised text block that will replace the original text in the document. You MUST execute the revision yourself. Do NOT output manual instructions to the user.
  4. Draft a strict, swift revision note (1 sentence maximum) replying to the reviewer stating what was done.
  5. Save your output to data/COMMENT_${id}_RESOLVED.md using strictly this XML format:
     <revised_text>
     [The exact revised text block]
     </revised_text>
     <reviewer_reply>
     [The drafted reply]
     </reviewer_reply>
  </rules>
  "
)`;
            const success = executeAgent(taskStr);
            if (success) {
                console.log(`✅ Processed COMMENT_${id} successfully.`);
            } else {
                console.log(`❌ Failed to process COMMENT_${id}.`);
            }
        });
    }

    // Wave 2: Interlaced Groups
    if (classifications.interlaced && classifications.interlaced.length > 0) {
        console.log(`\n#### Wave 2: Executing Interlaced Groups ####\n`);
        classifications.interlaced.forEach((group, index) => {
            // Check if all are resolved
            const allResolved = group.every(id => fs.existsSync(path.join(process.cwd(), 'data', `COMMENT_${id}_RESOLVED.md`)));
            if (allResolved) {
                console.log(`✅ Group ${index} already resolved. Skipping.`);
                return;
            }

            const filesList = group.map(id => `- data/COMMENT_${id}.md`).join('\\n  ');
            console.log(`⏳ Spawning subagent for Group ${index} [${group.join(', ')}]...`);

            const taskStr = `Task(
  subagent_type="rnr-processor-interlaced",
  model="claude-3-7-sonnet-20250219",
  prompt="
  <objective>
  Resolve the following related comments together to ensure consistency. You must adhere strictly to skills/style_skill.md.
  </objective>
  
  <files_to_read>
  Read these files at execution start using the Read tool:
  - skills/style_skill.md
  ${filesList}
  </files_to_read>
  
  <rules>
  1. DO NOT use NotebookLM or ask the user questions directly. If you need external research context, you MUST spawn this exact subagent to get it: Task(subagent_type=\\"rnr-researcher\\", prompt=\\"Query notebook ${notebookId} for: [Your concise question]\\")
  2. If any comment is vague or explicitly non-actionable as-is, you MUST spawn this exact subagent to negotiate it: Task(subagent_type=\\"rnr-clarifier\\", prompt=\\"Present this ambiguity to the user and ask how they want to proceed: [The context]\\"). Wait for its return string.
  3. Review how these comments relate to each other and draft the exact revised text blocks for each. You MUST execute the revisions yourself.
  4. Draft a strict, swift revision note (1 sentence maximum) for each comment.
  5. Save your output by creating a separate data/COMMENT_<ID>_RESOLVED.md file for EACH comment in your group, using strictly this XML format in each file:
     <revised_text>
     [The exact revised text block]
     </revised_text>
     <reviewer_reply>
     [The drafted reply]
     </reviewer_reply>
  </rules>
  "
)`;
            const success = executeAgent(taskStr);
            if (success) {
                console.log(`✅ Processed Group ${index} successfully.`);
            } else {
                console.log(`❌ Failed to process Group ${index}.`);
            }
        });
    }
}

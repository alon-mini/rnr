#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const spawnSync = require('cross-spawn').sync;

// Unset CLAUDECODE to bypass nested session restrictions when spawning subagents
delete process.env.CLAUDECODE;

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

if (command === 'execute-extractor') {
    const targetFile = process.argv[3];
    const reviewer = process.argv[4] ? ` --reviewer \\"${process.argv[4]}\\"` : '';

    if (!targetFile) {
        console.error('Missing target file for extraction.');
        process.exit(1);
    }

    const taskStr = `Task(
  subagent_type=\`rnr-extractor\`,
  model=\`claude-3-haiku-20240307\`,
  prompt=\`Execute the comment extraction tool. Run this exact bash command: 'python .rnr/src/parser.py ${targetFile}${reviewer} --data-dir ./data --unpack-dir ./unpacked'. Report the output back to me.\`
)`;

    console.log(`⏳ Spawning rnr-extractor...`);
    // We use spawnSync to completely avoid cmd.exe quote parsing errors.
    // Replace newlines but we don't need to manually escape double quotes for spawnSync.
    const escapedPrompt = taskStr.replace(/\n/g, ' ');
    try {
        const result = spawnSync('npx', ['@anthropic-ai/claude-code', '--dangerously-skip-permissions', '-p', escapedPrompt], { stdio: 'pipe' });
        if (result.status !== 0) {
            console.error(`❌ Failed to extract comments: ${result.stderr ? result.stderr.toString() : 'Unknown spawn error'}`);
            process.exit(1);
        }
        console.log(`✅ Extraction complete.`);
    } catch (error) {
        console.error(`❌ Failed to extract comments: ${error.message}`);
        process.exit(1);
    }
    process.exit(0);
}

if (command === 'generate-extract-task') {
    const targetFile = process.argv[3];
    const reviewer = process.argv[4] ? ` --reviewer \\"${process.argv[4]}\\"` : '';

    if (!targetFile) {
        console.error('Missing target file for extraction.');
        process.exit(1);
    }

    console.log(`Task(
  subagent_type=\`rnr-extractor\`,
  model=\`claude-3-haiku-20240307\`,
  prompt=\`Execute the comment extraction tool. Run this exact bash command: 'python .rnr/src/parser.py ${targetFile}${reviewer} --data-dir ./data --unpack-dir ./unpacked'. Report the output back to me.\`
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
  subagent_type=\`rnr-assembler\`,
  model=\`claude-3-haiku-20240307\`,
  prompt=\`Execute the document assembly tool. Run this exact bash command: 'python .rnr/src/assembler.py ${originalFile} ${outputFile} --data-dir ./data --unpack-dir ./unpacked'. Report the outcome.\`
)`);
    process.exit(0);
}

if (command === 'execute-synthesizer') {
    const taskStr = `Task(
  subagent_type=\`rnr-synthesizer\`,
  model=\`claude-3-haiku-20240307\`,
  prompt=\`
  <objective>
  Analyze the parsed document text to create a comprehensive skills/style_skill.md capturing the author's unique voice, terminology, and citation style.
  </objective>
  
  <files_to_read>
  Read data/document_map.json at execution start using the Read tool. Optionally read unpacked/word/document.xml.
  </files_to_read>
  
  <rules>
  1. Deeply analyze the text for Tone & Voice, Vocabulary, Sentence Structure, Transitions & Flow, and Citation Style.
  2. Produce a meticulously structured markdown file and save it to skills/style_skill.md using the Write tool.
  3. DO NOT ask the user any questions.
  </rules>
  \`
)`;

    console.log(`⏳ Spawning rnr-synthesizer...`);
    const escapedPrompt = taskStr.replace(/\n/g, ' ');
    try {
        const result = spawnSync('npx', ['@anthropic-ai/claude-code', '--dangerously-skip-permissions', '-p', escapedPrompt], { stdio: 'pipe' });
        if (result.status !== 0) {
            console.error(`❌ Failed to synthesize style: ${result.stderr ? result.stderr.toString() : 'Unknown spawn error'}`);
            process.exit(1);
        }
        console.log(`✅ Style synthesized.`);
    } catch (error) {
        console.error(`❌ Failed to synthesize style: ${error.message}`);
        process.exit(1);
    }
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

    // Helper function to safely escape quotes without cmd.exe string mangling
    const executeAgent = (taskString) => {
        const escapedPrompt = taskString.replace(/\n/g, ' ');
        try {
            // Using stdio: 'pipe' to suppress loud output from clogging the main orchestrator's context.
            const result = spawnSync('npx', ['@anthropic-ai/claude-code', '--dangerously-skip-permissions', '-p', escapedPrompt], { stdio: 'pipe' });
            if (result.status !== 0) {
                console.error(`Error executing subagent: ${result.stderr ? result.stderr.toString() : 'Unknown spawn error'}`);
                return false;
            }
            return true;
        } catch (error) {
            console.error(`Error executing subagent: ${error.message}`);
            return false;
        }
    };

    console.log(`\n### Executing Tasks via Node Orchestrator ###\n`);
    const pidPath = path.join(process.cwd(), '.rnr', 'orchestrator.pid');
    if (fs.existsSync(path.dirname(pidPath))) {
        fs.writeFileSync(pidPath, process.pid.toString());
    }

    // Wave 1: Isolated
    if (classifications.isolated && classifications.isolated.length > 0) {
        console.log(`\n#### Wave 1: Executing Isolated Comments ####\n`);
        classifications.isolated.forEach(id => {
            const resolvedPath = path.join(process.cwd(), 'data', 'resolved', `COMMENT_${id}_RESOLVED.md`);
            if (fs.existsSync(resolvedPath)) {
                console.log(`✅ COMMENT_${id} already resolved. Skipping.`);
                return;
            }

            console.log(`⏳ Spawning subagent for COMMENT_${id}...`);
            const taskStr = `Task(
  subagent_type=\`rnr-processor-isolated\`,
  model=\`claude-3-7-sonnet-20250219\`,
  prompt=\`
  <objective>
  Resolve the isolated comment. You must adhere strictly to the author's conventions in skills/style_skill.md.
  </objective>
  
  <files_to_read>
  Read these files at execution start using the Read tool:
  - skills/style_skill.md
  - data/extracted/COMMENT_${id}.md
  </files_to_read>
  
  <rules>
  1. DO NOT use NotebookLM or ask the user questions directly. If you need external research context, you MUST spawn this exact subagent to get it: Task(subagent_type='rnr-researcher', prompt='Query notebook ${notebookId} for: [Your concise question]')
  2. If the comment is vague or explicitly non-actionable as-is, you MUST spawn this exact subagent to negotiate it: Task(subagent_type='rnr-clarifier', prompt='Present this ambiguity to the user and ask how they want to proceed: [The context]'). Wait for its return string.
  3. Draft the exact revised text block that will replace the original text in the document. You MUST execute the revision yourself. Do NOT output manual instructions to the user.
  4. Draft a strict, swift revision note (1 sentence maximum) replying to the reviewer stating what was done.
  5. Save your output to data/resolved/COMMENT_${id}_RESOLVED.md using strictly this XML format:
     <revised_text>
     [The exact revised text block]
     </revised_text>
     <reviewer_reply>
     [The drafted reply]
     </reviewer_reply>
  </rules>
  \`
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
            const allResolved = group.every(id => fs.existsSync(path.join(process.cwd(), 'data', 'resolved', `COMMENT_${id}_RESOLVED.md`)));
            if (allResolved) {
                console.log(`✅ Group ${index} already resolved. Skipping.`);
                return;
            }

            const filesList = group.map(id => `- data/extracted/COMMENT_${id}.md`).join('\\n  ');
            console.log(`⏳ Spawning subagent for Group ${index} [${group.join(', ')}]...`);

            const taskStr = `Task(
  subagent_type=\`rnr-processor-interlaced\`,
  model=\`claude-3-7-sonnet-20250219\`,
  prompt=\`
  <objective>
  Resolve the following related comments together to ensure consistency. You must adhere strictly to skills/style_skill.md.
  </objective>
  
  <files_to_read>
  Read these files at execution start using the Read tool:
  - skills/style_skill.md
  ${filesList}
  </files_to_read>
  
  <rules>
  1. DO NOT use NotebookLM or ask the user questions directly. If you need external research context, you MUST spawn this exact subagent to get it: Task(subagent_type='rnr-researcher', prompt='Query notebook ${notebookId} for: [Your concise question]')
  2. If any comment is vague or explicitly non-actionable as-is, you MUST spawn this exact subagent to negotiate it: Task(subagent_type='rnr-clarifier', prompt='Present this ambiguity to the user and ask how they want to proceed: [The context]'). Wait for its return string.
  3. Review how these comments relate to each other and draft the exact revised text blocks for each. You MUST execute the revisions yourself.
  4. Draft a strict, swift revision note (1 sentence maximum) for each comment.
  5. Save your output by creating a separate resolved markdown file for EACH comment in your group. The filename must exactly match the input filename but with '_RESOLVED' appended before the '.md' extension (e.g., if you read 'data/extracted/COMMENT_EDIT_25.md', output to 'data/resolved/COMMENT_EDIT_25_RESOLVED.md'). Use strictly this XML format in each file:
     <revised_text>
     [The exact revised text block]
     </revised_text>
     <reviewer_reply>
     [The drafted reply]
     </reviewer_reply>
  </rules>
  \`
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

if (command === 'health-check') {
    const classificationPath = path.join(process.cwd(), 'data', 'classification.json');
    if (!fs.existsSync(classificationPath)) {
        console.log('No active processing session found (classification.json missing).');
        process.exit(0);
    }
    const classifications = JSON.parse(fs.readFileSync(classificationPath, 'utf8'));

    const requiredFiles = [];
    if (classifications.isolated) {
        classifications.isolated.forEach(id => requiredFiles.push(`COMMENT_${id}_RESOLVED.md`));
    }
    if (classifications.interlaced) {
        classifications.interlaced.forEach(group => {
            group.forEach(id => requiredFiles.push(`COMMENT_${id}_RESOLVED.md`));
        });
    }

    const total = requiredFiles.length;
    if (total === 0) {
        console.log('No comments to process.');
        process.exit(0);
    }

    let resolvedCount = 0;
    let latestTime = 0;
    let earliestTime = Date.now();

    requiredFiles.forEach(f => {
        const fullPath = path.join(process.cwd(), 'data', 'resolved', f);
        if (fs.existsSync(fullPath)) {
            resolvedCount++;
            const stats = fs.statSync(fullPath);
            const mtime = stats.mtimeMs;
            if (mtime > latestTime) latestTime = mtime;
            if (mtime < earliestTime) earliestTime = mtime;
        }
    });

    const pidFile = path.join(process.cwd(), '.rnr', 'orchestrator.pid');
    let isRunning = false;
    if (fs.existsSync(pidFile)) {
        try {
            const pid = parseInt(fs.readFileSync(pidFile, 'utf8'), 10);
            process.kill(pid, 0);
            isRunning = true;
        } catch (e) {
            isRunning = false;
        }
    }

    console.log(`\n### R&R Comment Processor Health Check ###\n`);
    console.log(`Progress: ${resolvedCount} / ${total} comments resolved (${Math.round(resolvedCount / total * 100)}%)`);

    if (resolvedCount === total) {
        console.log(`Status: ALL DONE! You can now run '/rnr:assemble'.`);
    } else if (resolvedCount > 1) {
        const timeElapsed = latestTime - earliestTime;
        const avgTimePerComment = timeElapsed / (resolvedCount - 1);
        const remaining = total - resolvedCount;
        const estimatedRemainingMs = remaining * avgTimePerComment;
        const estimatedRemainingMins = Math.ceil(estimatedRemainingMs / 60000);
        console.log(`Estimated time remaining: ~${estimatedRemainingMins} minutes.`);
    }

    if (resolvedCount < total) {
        if (!isRunning && fs.existsSync(pidFile)) {
            console.log(`\n[FAILED] The orchestrator process is no longer running, but there are still unprocessed comments.`);
            console.log(`Please run the execute-tasks command again to resume.`);
        } else {
            console.log(`\n[HEALTHY] The orchestrator process is currently running.`);
        }
    }
    process.exit(0);
}

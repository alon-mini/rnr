#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const args = process.argv.slice(2);
const isGlobal = args.includes('--global') || args.includes('-g');

const CLAUDE_DIR = isGlobal
  ? path.join(require('os').homedir(), '.claude')
  : path.join(process.cwd(), '.claude');

const COMMANDS_SRC = path.join(__dirname, '..', 'commands', 'rnr');
const COMMANDS_DEST = path.join(CLAUDE_DIR, 'commands', 'rnr');

console.log('Installing Revise & Resubmit (R&R) Framework for Claude Code...');

try {
  // Ensure destination exists
  fs.mkdirSync(COMMANDS_DEST, { recursive: true });

  // Copy command files
  const files = fs.readdirSync(COMMANDS_SRC);
  files.forEach(file => {
    if (file.endsWith('.md')) {
      fs.copyFileSync(
        path.join(COMMANDS_SRC, file),
        path.join(COMMANDS_DEST, file)
      );
      console.log(`✓ Installed command: /rnr:${file.replace('.md', '')}`);
    }
  });

  // Copy agent files
  const AGENTS_SRC = path.join(__dirname, '..', 'agents');
  if (fs.existsSync(AGENTS_SRC)) {
    const AGENTS_DEST = path.join(CLAUDE_DIR, 'agents');
    fs.mkdirSync(AGENTS_DEST, { recursive: true });

    // Remove old R&R agents before copying new ones
    if (fs.existsSync(AGENTS_DEST)) {
      for (const file of fs.readdirSync(AGENTS_DEST)) {
        if (file.startsWith('rnr-') && file.endsWith('.md')) {
          fs.unlinkSync(path.join(AGENTS_DEST, file));
        }
      }
    }

    const agentFiles = fs.readdirSync(AGENTS_SRC);
    agentFiles.forEach(file => {
      if (file.endsWith('.md')) {
        fs.copyFileSync(
          path.join(AGENTS_SRC, file),
          path.join(AGENTS_DEST, file)
        );
        console.log(`✓ Installed agent: ${file.replace('.md', '')}`);
      }
    });
  }

  console.log('\nSuccess! R&R Framework installed.');
  console.log(`Commands were installed to: ${COMMANDS_DEST}`);
  console.log('\nTo use, open Claude Code and run:');
  console.log('  /rnr:help');

} catch (err) {
  console.error('\nInstallation failed:', err.message);
  process.exit(1);
}

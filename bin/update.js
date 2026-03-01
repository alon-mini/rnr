#!/usr/bin/env node

const { execSync } = require('child_process');
const path = require('path');
const os = require('os');
const fs = require('fs');

console.log('Updating Revise & Resubmit (R&R) Framework...');

const rnrDir = path.join(__dirname, '..');

try {
  // 1. Pull the latest code from GitHub
  console.log('\nFetching latest updates from GitHub...');
  execSync('git pull origin main', { cwd: rnrDir, stdio: 'inherit' });

  // 2. We need to determine if the installation was global or local.
  // We can do this by checking if the `.claude/commands/rnr` folder exists in the project root vs home dir.
  
  const localClaudeDir = path.join(process.cwd(), '.claude', 'commands', 'rnr');
  const globalClaudeDir = path.join(os.homedir(), '.claude', 'commands', 'rnr');
  
  let installCommand = 'node bin/install.js --claude';
  
  if (fs.existsSync(localClaudeDir)) {
    console.log('\nDetected local installation.');
    installCommand += ' --local';
  } else if (fs.existsSync(globalClaudeDir)) {
    console.log('\nDetected global installation.');
    installCommand += ' --global';
  } else {
    console.log('\nCould not detect an existing installation. Defaulting to global update.');
    installCommand += ' --global';
  }

  // 3. Re-run the install script to copy the newly fetched .md files
  console.log('\nRe-installing Claude Code commands...');
  execSync(installCommand, { cwd: rnrDir, stdio: 'inherit' });

  console.log('\nSuccess! R&R Framework has been updated to the latest version.');

} catch (err) {
  console.error('\nUpdate failed:', err.message);
  process.exit(1);
}

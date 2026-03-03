const spawnSync = require('cross-spawn').sync;
const taskStr = `Task(prompt=" <test> ")`;
const result = spawnSync('npx', ['--version', taskStr], { stdio: 'inherit' });
console.log('Result:', result.status, result.error ? result.error.message : '');
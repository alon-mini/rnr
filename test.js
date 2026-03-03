const fs = require('fs');
const { spawnSync } = require('child_process');

fs.writeFileSync('test-args.js', 'console.log(process.argv);');

// The string we want to pass:
const taskStr = `Task(
  subagent_type="rnr-extractor",
  prompt="Execute python script: \\"python script.py --reviewer \\"REUT HARARI\\"\\""
)`;
console.log("Original string:");
console.log(taskStr);

const escaped = taskStr.replace(/\n/g, ' ');

const result = spawnSync('node', ['test-args.js', '-p', escaped], { shell: true });
console.log("With shell: true ->");
console.log(result.stdout ? result.stdout.toString() : result.error);

const result2 = spawnSync(process.execPath, ['test-args.js', '-p', escaped]);
console.log("Without shell ->");
console.log(result2.stdout ? result2.stdout.toString() : result2.error);

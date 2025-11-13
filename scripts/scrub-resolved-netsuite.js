const fs = require('fs');
const path = require('path');

const DOMAIN = 'repository.eng.netsuite.com';
const targets = [
  path.join('todo-frontend', 'package-lock.json'),
  path.join('tests-e2e', 'package-lock.json'),
];

function scrubResolved(obj) {
  let count = 0;
  if (obj && typeof obj === 'object') {
    if (
      Object.prototype.hasOwnProperty.call(obj, 'resolved') &&
      typeof obj.resolved === 'string' &&
      obj.resolved.includes(DOMAIN)
    ) {
      delete obj.resolved;
      count++;
    }
    if (Object.prototype.hasOwnProperty.call(obj, 'integrity')) {
      delete obj.integrity;
      count++;
    }
    if (Array.isArray(obj)) {
      for (const item of obj) {
        count += scrubResolved(item);
      }
    } else {
      for (const key of Object.keys(obj)) {
        count += scrubResolved(obj[key]);
      }
    }
  }
  return count;
}

function processFile(file) {
  try {
    const original = fs.readFileSync(file, 'utf8');
    const json = JSON.parse(original);
    const removed = scrubResolved(json);

    if (removed > 0) {
      const backup = file + '.bak';
      fs.writeFileSync(backup, original, 'utf8');
      fs.writeFileSync(file, JSON.stringify(json, null, 2) + '\n', 'utf8');
      console.log(`${file}: removed ${removed} fields ("resolved" with ${DOMAIN} and any "integrity"). Backup: ${backup}`);
    } else {
      console.log(`${file}: no matching "resolved" entries found. No changes made.`);
    }
  } catch (err) {
    console.error(`${file}: ERROR - ${err.message}`);
    process.exitCode = 1;
  }
}

for (const f of targets) {
  if (fs.existsSync(f)) {
    processFile(f);
  } else {
    console.warn(`${f}: file not found, skipped.`);
  }
}

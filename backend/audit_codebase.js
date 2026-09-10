const fs = require('fs');
const path = require('path');

console.log('====================================================');
console.log('      EDUCIRCLE SYSTEMATIC CODE AUDIT REPORT        ');
console.log('====================================================\n');

let issuesFound = 0;

const htmlPath = path.join(__dirname, '..', 'index.html');
const html = fs.readFileSync(htmlPath, 'utf8');

// 1. Audit JavaScript Syntax of script tags
console.log('--- 1. Testing Embedded Scripts Syntax ---');
const scriptRegex = /<script\b[^>]*>([\s\S]*?)<\/script>/gi;
let scriptMatch;
let scriptIdx = 0;
while ((scriptMatch = scriptRegex.exec(html)) !== null) {
  scriptIdx++;
  const code = scriptMatch[1].trim();
  if (code.length > 20) {
    try {
      new Function(code);
      console.log(`  [PASS] Script block #${scriptIdx} (${code.length} bytes): Valid JavaScript Syntax.`);
    } catch (err) {
      issuesFound++;
      console.error(`  [FAIL] Syntax error in script block #${scriptIdx}: ${err.message}`);
    }
  }
}

// 2. Extract all window.App methods (including async)
console.log('\n--- 2. Auditing window.App methods & inline event handlers ---');
const startIdx = html.indexOf('window.App = {');
const endIdx = html.indexOf("window.addEventListener('DOMContentLoaded'", startIdx);
const appBlock = html.substring(startIdx, endIdx);

const appMethods = new Set();
const appMethodRegex = /(?:async\s+)?([a-zA-Z0-9_]+)\s*\([^)]*\)\s*\{/g;
let m;
while ((m = appMethodRegex.exec(appBlock)) !== null) {
  appMethods.add(m[1]);
}
console.log(`  Found ${appMethods.size} methods on window.App.`);

// Find all App.xxx calls in the entire HTML
const allAppCalls = new Set();
const appCallRegex = /\bApp\.([a-zA-Z0-9_]+)\s*\(/g;
let cm;
while ((cm = appCallRegex.exec(html)) !== null) {
  allAppCalls.add(cm[1]);
}

const missingAppMethods = [];
for (const method of allAppCalls) {
  if (!appMethods.has(method)) {
    missingAppMethods.push(method);
  }
}

if (missingAppMethods.length > 0) {
  issuesFound += missingAppMethods.length;
  console.error(`  [FAIL] Missing methods on window.App called in HTML: ${missingAppMethods.join(', ')}`);
} else {
  console.log(`  [PASS] All ${allAppCalls.size} unique App.xxx(...) method calls exist on window.App!`);
}

// 3. Audit document.getElementById calls vs statically rendered or template IDs
console.log('\n--- 3. Auditing document.getElementById References ---');
const getElemCalls = new Set();
const getElemRegex = /document\.getElementById\(\s*['"`]([^'"`$]+)['"`]\s*\)/g;
let gm;
while ((gm = getElemRegex.exec(html)) !== null) {
  getElemCalls.add(gm[1]);
}

console.log(`  Inspecting ${getElemCalls.size} static getElementById calls...`);
const missingIds = [];
for (const id of getElemCalls) {
  if (id === 'global-toast') continue; // Dynamically created in showToast
  const idRegex = new RegExp(`id=["']${id}["']`, 'i');
  if (!idRegex.test(html)) {
    missingIds.push(id);
  }
}

if (missingIds.length > 0) {
  issuesFound += missingIds.length;
  console.error(`  [FAIL] Missing DOM IDs: ${missingIds.join(', ')}`);
} else {
  console.log(`  [PASS] All ${getElemCalls.size} getElementById targets exist in HTML or template strings!`);
}

// 4. Audit Local Assets & Images referenced in HTML
console.log('\n--- 4. Auditing Local Image/Asset References ---');
const assetRegex = /(?:src|href)=["'](docs\/[^"']+|assets\/[^"']+)["']/gi;
let am;
let missingAssets = 0;
while ((am = assetRegex.exec(html)) !== null) {
  const assetPath = path.join(__dirname, '..', am[1]);
  if (!fs.existsSync(assetPath)) {
    missingAssets++;
    issuesFound++;
    console.error(`  [FAIL] Missing asset: ${am[1]} (expected at ${assetPath})`);
  }
}
if (missingAssets === 0) {
  console.log('  [PASS] All local docs/* and assets/* images and badges exist on disk!');
}

// 5. Audit Backend files
console.log('\n--- 5. Auditing Backend Node.js Modules ---');
const backendFiles = ['server.js', 'check_syntax.js'];
backendFiles.forEach(f => {
  const bfPath = path.join(__dirname, f);
  if (fs.existsSync(bfPath)) {
    const code = fs.readFileSync(bfPath, 'utf8');
    try {
      new Function(code);
      console.log(`  [PASS] Backend ${f}: Valid Node.js Syntax.`);
    } catch (err) {
      issuesFound++;
      console.error(`  [FAIL] Backend ${f} syntax error: ${err.message}`);
    }
  }
});

// 6. Audit JSON database files
console.log('\n--- 6. Auditing JSON Database Files ---');
const dataDir = path.join(__dirname, 'data');
if (fs.existsSync(dataDir)) {
  const jsonFiles = fs.readdirSync(dataDir).filter(f => f.endsWith('.json'));
  jsonFiles.forEach(jf => {
    try {
      const content = fs.readFileSync(path.join(dataDir, jf), 'utf8');
      JSON.parse(content);
      console.log(`  [PASS] JSON DB ${jf}: Valid JSON.`);
    } catch (err) {
      issuesFound++;
      console.error(`  [FAIL] JSON DB ${jf} parse error: ${err.message}`);
    }
  });
}

// 7. Audit Synchronization across all 4 mirrors
console.log('\n--- 7. Auditing Mirror Consistency ---');
const crypto = require('crypto');
const mirrors = [
  path.join(__dirname, '..', 'index.html'),
  path.join(__dirname, '..', 'campushare_app.html'),
  path.join(__dirname, '..', 'frontend', 'index.html'),
  path.join(__dirname, '..', 'frontend', 'campushare_app.html')
];

let referenceHash = null;
mirrors.forEach(mp => {
  if (fs.existsSync(mp)) {
    const hash = crypto.createHash('sha256').update(fs.readFileSync(mp)).digest('hex');
    if (!referenceHash) {
      referenceHash = hash;
      console.log(`  Reference Hash: ${hash.substring(0, 16)}... (${path.relative(path.join(__dirname, '..'), mp)})`);
    } else if (hash !== referenceHash) {
      issuesFound++;
      console.error(`  [FAIL] Out of sync: ${path.relative(path.join(__dirname, '..'), mp)} hash differs!`);
    } else {
      console.log(`  [PASS] In sync: ${path.relative(path.join(__dirname, '..'), mp)} matches reference.`);
    }
  } else {
    issuesFound++;
    console.error(`  [FAIL] Mirror file missing: ${mp}`);
  }
});

console.log('\n====================================================');
if (issuesFound === 0) {
  console.log('ALL CHECKS PASSED: 0 BUGS DETECTED!');
} else {
  console.log(`AUDIT FINISHED: ${issuesFound} POTENTIAL ISSUES FLAGGED.`);
}
console.log('====================================================\n');
process.exit(issuesFound > 0 ? 1 : 0);

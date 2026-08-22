const fs = require('fs');
const path = require('path');

try {
  const htmlPath = path.join(__dirname, '..', 'index.html');
  const content = fs.readFileSync(htmlPath, 'utf8');
  
  // Extract content between <script> and </script>
  const startTag = '<script>';
  const endTag = '</script>';
  
  let startIndex = 0;
  while (true) {
    startIndex = content.indexOf(startTag, startIndex);
    if (startIndex === -1) break;
    startIndex += startTag.length;
    
    const endIndex = content.indexOf(endTag, startIndex);
    if (endIndex === -1) break;
    
    const scriptContent = content.substring(startIndex, endIndex);
    
    // Check if it's the main JS block (ignores CSS, CDNs, etc.)
    if (scriptContent.includes('const INITIAL_USERS')) {
      console.log('Testing main script syntax block...');
      try {
        const vm = require('vm');
        new vm.Script(scriptContent, { filename: 'index.html' });
        console.log('✅ Syntax Check Passed: JavaScript inside index.html is 100% syntactically correct.');
      } catch (err) {
        console.error('❌ JavaScript Syntax Error found inside <script> tag:', err.message);
        console.error(err.stack);
      }
    }
    startIndex = endIndex + endTag.length;
  }
} catch (e) {
  console.error('Error reading index.html:', e.message);
}

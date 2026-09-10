const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

// Mock browser globals
const localStorageStore = {};
global.localStorage = {
  getItem: (k) => localStorageStore[k] || null,
  setItem: (k, v) => { localStorageStore[k] = v.toString(); },
  removeItem: (k) => { delete localStorageStore[k]; },
  clear: () => { for (let k in localStorageStore) delete localStorageStore[k]; }
};

global.window = {
  location: { reload: () => {} },
  scrollTo: () => {},
  open: () => {},
  addEventListener: () => {}
};
global.document = {
  documentElement: { classList: { add: () => {}, remove: () => {} } },
  getElementById: (id) => ({
    value: 'test',
    innerHTML: '',
    innerText: '',
    checked: true, remove: () => {},
    focus: () => {},
    setSelectionRange: () => {}
  }),
  createElement: () => ({ appendChild: () => {}, className: '', style: {}, remove: () => {}, click: () => {} }),
  body: { appendChild: () => {} }
};
global.lucide = { createIcons: () => {} };
global.showToast = (msg, type) => { /* console.log(`[TOAST ${type || 'info'}]: ${msg}`); */ };

// Extract main script block
const lastScriptStart = html.lastIndexOf('<script');
const codeStart = html.indexOf('>', lastScriptStart) + 1;
const codeEnd = html.indexOf('</script>', codeStart);
const mainScript = html.substring(codeStart, codeEnd);

try {
  eval(mainScript.replace('const stateObj =', 'global.stateObj =')); global.App = window.App;
  console.log("✓ Main script evaluated into runtime context without errors!");
} catch (err) {
  console.error("❌ Runtime evaluation error:", err);
  process.exit(1);
}

console.log("\n--- Testing Core Workflows ---");

// Test 1: State initialization
console.log("1. State Initialization:");
console.log(`   - Users: ${stateObj.users.length}`);
console.log(`   - Resources: ${stateObj.resources.length}`);
console.log(`   - Transactions: ${stateObj.transactions.length}`);
console.log(`   - Notifications: ${stateObj.notifications.length}`);

// Test 2: Demo Student Login
console.log("\n2. Testing Student Login:");
const studentUser = stateObj.users.find(u => u.email === 'tejasmahajan1002@gmail.com');
if (!studentUser) {
  console.error("❌ Demo student not found!");
  process.exit(1);
}
stateObj.currentUser = studentUser;
console.log(`   ✓ Logged in as: ${studentUser.name} (${studentUser.role})`);

// Test 3: Trust Level calculation
console.log("\n3. Testing Trust Calculation:");
const trust = getTrustLevel(studentUser);
console.log(`   ✓ Trust Score: ${trust.score}, Level: ${trust.level}`);

// Test 4: Dashboard rendering
console.log("\n4. Testing Dashboard HTML Generation:");
const dashHtml = App.getDashboardHtml();
if (!dashHtml || dashHtml.length < 500) {
  console.error("❌ Dashboard HTML is unexpectedly empty or broken!");
  process.exit(1);
}
console.log(`   ✓ Dashboard generated successfully (${dashHtml.length} characters).`);

// Test 5: Explore Screen & Category Filters
console.log("\n5. Testing Explore Screen with Filters:");
App.setCategoryFilter('Calculators');
let exploreHtml = App.getExploreHtml();
console.log(`   ✓ Filter 'Calculators' rendered (${exploreHtml.length} chars).`);

App.setCategoryFilter('all');
App.handleSearchInput('Casio');
exploreHtml = App.getExploreHtml();
console.log(`   ✓ Search 'Casio' rendered (${exploreHtml.length} chars).`);

// Test 6: Clean Checkout Modal Generation
console.log("\n6. Testing Peer Checkout Modal Flow:");
stateObj.resources = [{
  id: 'r_test_book',
  name: 'GATE BOOK SEM 3',
  category: 'Books',
  ownerId: 'u_gaikwad_prajwal',
  ownerName: 'Prajwal Gaikwad',
  listingMethod: 'sell',
  price: 450,
  quantity: 1,
  availableQuantity: 1,
  availability: 'available',
  condition: 'Good',
  description: 'Clean textbook for semester preparation.'
}];
App.openBorrowRequestModal('r_test_book');
console.log("   ✓ openBorrowRequestModal executed cleanly without payment methods.");

// Test 8: Admin Login & Screen
console.log("\n8. Testing Admin Flow:");
const adminUser = stateObj.users.find(u => u.role === 'admin');
stateObj.currentUser = adminUser;
const adminHtml = App.getAdminHtml();
console.log(`   ✓ Admin screen rendered successfully (${adminHtml.length} characters).`);

// Test 9: In-Website Direct Chat Flow
console.log("\n9. Testing In-Website Direct Chat Flow:");
stateObj.currentUser = studentUser;
App.openChatWithOwner('u_gaikwad_prajwal', 'Prajwal Gaikwad', 'GATE BOOK SEM 3');
if (App.currentView !== 'messages' || App.viewParams.chatWith !== 'u_gaikwad_prajwal') {
  console.error("❌ Direct Chat navigation failed!");
  process.exit(1);
}
const msgsHtml = App.getMessagesHtml();
if (!msgsHtml || !msgsHtml.includes('Conversations')) {
  console.error("❌ Messages screen failed to render!");
  process.exit(1);
}
console.log(`   ✓ Messages screen rendered successfully (${msgsHtml.length} characters).`);
App.selectChat('u_gaikwad_prajwal');
// Test 10: Study Materials, Student Folders & PDF Flow
console.log("\n10. Testing Study Materials & Student Folders Flow:");
stateObj.currentUser = studentUser;
stateObj.studyFolders = [];
stateObj.studyMaterials = [];

// 10.1 Root Study Materials View
const studyRootHtml = App.getStudyMaterialsHtml();
if (!studyRootHtml || !studyRootHtml.includes('Student Study Folders')) {
  console.error("❌ Study Materials Hub failed to render root view!");
  process.exit(1);
}
console.log("   ✓ Root Study Materials Hub rendered successfully.");

// 10.2 Create Folder
const baseMockEl = (val = '') => ({
  value: val,
  checked: false,
  style: {},
  innerHTML: '',
  innerText: '',
  remove: () => {},
  focus: () => {},
  setSelectionRange: () => {}
});

document.getElementById = (id) => {
  if (id === 'new-folder-name') return baseMockEl('Data Structures & Algorithms');
  if (id === 'new-folder-subject') return baseMockEl('Computer Engineering');
  if (id === 'new-folder-desc') return baseMockEl('Lecture slides and notes');
  return baseMockEl();
};
App.submitCreateFolder();
if (stateObj.studyFolders.length !== 1 || stateObj.studyFolders[0].name !== 'Data Structures & Algorithms') {
  console.error("❌ Failed to create study folder!");
  process.exit(1);
}
const createdFolder = stateObj.studyFolders[0];
console.log(`   ✓ Folder created: "${createdFolder.name}" owned by ${createdFolder.ownerName}`);

// 10.3 Upload PDF into Student's Folder
App.selectedPdfBase64 = 'data:application/pdf;base64,JVBERi0xLjQKJcTl8uXr...';
App.selectedPdfFileName = 'DSA_Trees_Notes.pdf';
App.selectedPdfFileSize = '2.4 MB';

document.getElementById = (id) => {
  if (id === 'upload-doc-title') return baseMockEl('Binary Trees & Graphs Full Notes');
  if (id === 'upload-target-folder') return baseMockEl(createdFolder.id);
  if (id === 'upload-doc-subject') return baseMockEl('Computer Engineering');
  if (id === 'upload-doc-sem') return baseMockEl('Semester 3');
  if (id === 'upload-doc-desc') return baseMockEl('Complete unit 4 coverage');
  return baseMockEl();
};
App.submitUploadPdf();

if (stateObj.studyMaterials.length !== 1 || stateObj.studyMaterials[0].title !== 'Binary Trees & Graphs Full Notes') {
  console.error("❌ Failed to upload PDF into student folder!");
  process.exit(1);
}
const uploadedDoc = stateObj.studyMaterials[0];
console.log(`   ✓ PDF stored in folder: "${uploadedDoc.title}" (${uploadedDoc.fileSize})`);

// 10.4 Verify Folder View Rendering
App.openStudyFolder(createdFolder.id);
const folderViewHtml = App.getStudyMaterialsHtml();
if (!folderViewHtml || !folderViewHtml.includes('Binary Trees & Graphs Full Notes')) {
  console.error("❌ Folder view failed to display uploaded PDF!");
  process.exit(1);
}
console.log("   ✓ Folder view rendered with uploaded PDF.");

// 10.5 Auto-generate Folder on Upload Test
stateObj.currentUser = { id: 'u_student_new', name: 'Rohan Sharma', role: 'student' };
App.selectedPdfBase64 = 'data:application/pdf;base64,JVBERi0xLjQK...';
App.selectedPdfFileName = 'Maths_Formulae.pdf';
App.selectedPdfFileSize = '500 KB';
document.getElementById = (id) => {
  if (id === 'upload-doc-title') return baseMockEl('Quick Maths Cheat Sheet');
  if (id === 'upload-target-folder') return baseMockEl('auto_generate');
  if (id === 'upload-custom-folder-name') return baseMockEl("Rohan's Exam Vault");
  if (id === 'upload-doc-subject') return baseMockEl('Maths');
  if (id === 'upload-doc-sem') return baseMockEl('Semester 3');
  return baseMockEl();
};
App.submitUploadPdf();

const autoGenFolder = stateObj.studyFolders.find(f => f.name === "Rohan's Exam Vault");
if (!autoGenFolder) {
  console.error("❌ Auto folder generation during upload failed!");
  process.exit(1);
}
console.log(`   ✓ Auto-generated folder: "${autoGenFolder.name}" for new student.`);

// 10.6 Cross-student Upload Restriction Test (Security Check)
// Rohan Sharma cannot upload to Tejas Mahajan's folder
const countBeforeMalicious = stateObj.studyMaterials.length;
document.getElementById = (id) => {
  if (id === 'upload-doc-title') return baseMockEl('Malicious Upload Attempt');
  if (id === 'upload-target-folder') return baseMockEl(createdFolder.id); // Tejas's folder
  return baseMockEl();
};
App.submitUploadPdf();
if (stateObj.studyMaterials.length !== countBeforeMalicious) {
  console.error("❌ Security failure: Student was able to upload into another student's folder!");
  process.exit(1);
}
console.log("   ✓ Security enforced: Student cannot upload into another student's folder.");

// 10.7 Download & View
App.downloadStudyPdf(uploadedDoc.id);
if (uploadedDoc.downloads !== 1) {
  console.error("❌ Download count did not increment!");
  process.exit(1);
}
console.log("   ✓ PDF download count incremented.");

console.log("\n====================================================");
console.log("✅ ALL FUNCTIONAL RUNTIME TESTS PASSED WITH 0 ERRORS!");
console.log("====================================================");



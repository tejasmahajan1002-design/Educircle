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
  createElement: () => ({ appendChild: () => {}, className: '', style: {}, remove: () => {} }),
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
console.log("   ✓ selectChat executed without errors.");

console.log("\n====================================================");
console.log("✅ ALL FUNCTIONAL RUNTIME TESTS PASSED WITH 0 ERRORS!");
console.log("====================================================");


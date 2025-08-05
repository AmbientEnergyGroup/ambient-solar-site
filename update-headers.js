const fs = require('fs');
const path = require('path');

// List of known page paths to update
const pagesToUpdate = [
  'dashboard',
  'new-set',
    'sets',
  'leaderboard',
  'hr',
  'incentives',
  'account',
  'canvassing',
  'projects',
  'manager-roles',
  'recruiting-form',
  'schedule',
  'developer'
];

// Path to app directory
const appDir = path.join(__dirname, 'src', 'app');

// Function to update a page file
function updatePageFile(filePath) {
  try {
    // Read the file
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Check if the MessagesButton is already imported
    if (!content.includes('import MessagesButton from "@/components/MessagesButton";')) {
      // Add import for MessagesButton
      content = content.replace(
        /(import.*from.*;(\r?\n)+)/,
        '$1import MessagesButton from "@/components/MessagesButton";\n\n'
      );
    }
    
    // Check if the Messages button is already in the header
    if (!content.includes('{/* Messages button */}')) {
      // Find the sidebar toggle button and add the Messages button after it
      content = content.replace(
        /(onClick=\(\) => setSidebarOpen\(!sidebarOpen\).*?<\/button>(\r?\n))/s,
        '$1\n            {/* Messages button */}\n            <div className="ml-2">\n              <MessagesButton />\n            </div>\n\n'
      );
    }
    
    // Write the updated file
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated: ${filePath}`);
    return true;
    
  } catch (error) {
    console.error(`Error updating ${filePath}: ${error.message}`);
    return false;
  }
}

// Count of successfully updated files
let successCount = 0;

// Process each page
pagesToUpdate.forEach(page => {
  const pagePath = path.join(appDir, page, 'page.tsx');
  
  // Check if page exists
  if (fs.existsSync(pagePath)) {
    const updated = updatePageFile(pagePath);
    if (updated) successCount++;
  } else {
    console.log(`Skipped: ${pagePath} (file not found)`);
  }
});

console.log(`\nSuccessfully updated ${successCount} of ${pagesToUpdate.length} page files.`);
console.log(`Run this script with: node update-headers.js`); 
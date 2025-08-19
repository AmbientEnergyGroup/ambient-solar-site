const fs = require('fs');
const path = require('path');

// Read the current .env.local file
const envPath = path.join(__dirname, '.env.local');
let envContent = fs.readFileSync(envPath, 'utf8');

// Update the Firebase configuration values
const updates = {
  'YOUR_FIREBASE_AUTH_DOMAIN': 'ambient-pro.firebaseapp.com',
  'YOUR_FIREBASE_PROJECT_ID': 'ambient-pro',
  'YOUR_FIREBASE_MESSAGING_SENDER_ID': '123456789012',
  'YOUR_FIREBASE_APP_ID': '1:123456789012:web:abcdef1234567890',
  'YOUR_FIREBASE_MEASUREMENT_ID': 'G-XXXXXXXXXX'
};

// Apply the updates
Object.entries(updates).forEach(([placeholder, value]) => {
  envContent = envContent.replace(new RegExp(placeholder, 'g'), value);
});

// Write the updated content back to the file
fs.writeFileSync(envPath, envContent);

console.log('✅ Firebase configuration updated successfully!');
console.log('📝 Updated values:');
Object.entries(updates).forEach(([placeholder, value]) => {
  console.log(`   ${placeholder} → ${value}`);
});
console.log('\n⚠️  Note: You may need to update the MESSAGING_SENDER_ID and APP_ID with your actual Firebase project values.');
console.log('   You can find these in your Firebase Console under Project Settings > General > Your apps'); 
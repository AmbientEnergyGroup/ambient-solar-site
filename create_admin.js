// Script to create an admin user directly in localStorage

// Create a unique user ID
const adminUserId = "admin_" + Date.now();

// Current date as ISO string
const now = new Date().toISOString();

// Create the admin user data
const adminUserData = {
  id: adminUserId,
  role: "admin",
  displayName: "Asher Crosby",
  email: "admin@ambient.com",
  createdAt: now,
  active: true,
  payType: "Pro Rep",
  userRole: "Self Gen",
  managerName: "Asher Crosby"
};

// Save to localStorage (will need to be run in the browser console)
console.log("Copy and paste this into your browser console when on the app:");
console.log(`localStorage.setItem('userData_${adminUserId}', '${JSON.stringify(adminUserData)}');`);
console.log(`localStorage.setItem('currentUser', '${JSON.stringify({
  uid: adminUserId,
  email: "admin@ambient.com",
  displayName: "Asher Crosby",
  role: "admin"
})}');`);
console.log(`console.log("Admin user created! Refresh the page and you should have access to the developer console.");`); 
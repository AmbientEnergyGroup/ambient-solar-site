# Firebase Setup Guide for Ambient Pro

## Quick Fix for Login Issues

### 1. Create Environment Variables File

Create a `.env.local` file in your project root with your Firebase configuration:

```bash
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

### 2. Get Your Firebase Configuration

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project (or create a new one)
3. Click the gear icon → Project settings
4. Scroll down to "Your apps" section
5. Click the web app icon (</>) to add a web app
6. Register your app and copy the configuration

### 3. Enable Authentication Methods

In Firebase Console → Authentication → Sign-in method:

**Enable Email/Password:**
- Click "Email/Password"
- Enable "Email/Password"
- Enable "Email link (passwordless sign-in)"

**Enable Google Sign-in:**
- Click "Google"
- Enable Google sign-in
- Add your support email

### 4. Configure Authorized Domains

In Firebase Console → Authentication → Settings:

Add these domains to "Authorized domains":
- `localhost` (for development)
- Your production domain (e.g., `yourdomain.com`)

### 5. Set Up Firestore Database

1. Go to Firestore Database
2. Click "Create database"
3. Choose "Start in test mode" (for development)
4. Select a location close to your users

### 6. Update Firestore Rules

Replace the default rules with:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow users to read/write their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Allow admins to read all user data
    match /users/{document=**} {
      allow read: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // Allow authenticated users to read public data
    match /{document=**} {
      allow read: if request.auth != null;
    }
  }
}
```

## Testing the Setup

1. Restart your development server:
   ```bash
   npm run dev
   ```

2. Try logging in with:
   - Email link authentication (enter email, click "Send Login Link")
   - Google Sign-in (click "Sign in with Google")

## Common Issues & Solutions

### Issue: "Firebase: Error (auth/unauthorized-domain)"
**Solution:** Add your domain to Firebase Console → Authentication → Settings → Authorized domains

### Issue: "Firebase: Error (auth/invalid-api-key)"
**Solution:** Check your `.env.local` file has the correct API key

### Issue: "Firebase: Error (auth/user-not-found)"
**Solution:** The user doesn't exist in Firebase. They need to sign up first.

### Issue: Email links not working
**Solution:** 
1. Check spam folder
2. Verify domain is authorized in Firebase
3. Check Firebase Console → Authentication → Templates for email settings

## Production Deployment

For production, make sure to:

1. Update environment variables with production Firebase project
2. Add your production domain to authorized domains
3. Set up proper Firestore security rules
4. Configure email templates in Firebase Console

## Support

If you're still having issues:

1. Check browser console for specific error messages
2. Verify all environment variables are set correctly
3. Ensure Firebase project is properly configured
4. Check that all authentication methods are enabled

## Quick Test

To test if everything is working:

1. Open browser console (F12)
2. Try to log in
3. Look for any error messages
4. Check Network tab for failed requests

The most common issue is missing or incorrect Firebase configuration in the `.env.local` file. 
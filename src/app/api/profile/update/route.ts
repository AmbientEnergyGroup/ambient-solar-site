import { NextRequest, NextResponse } from 'next/server';
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, updateDoc } from 'firebase/firestore';

// Firebase configuration for server-side
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase for server-side
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, updates } = body;

    console.log('API Route: Received profile update request');
    console.log('API Route: User ID:', userId);
    console.log('API Route: Updates:', updates);

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Clean the updates object to remove undefined values
    const cleanUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, value]) => {
        if (value === undefined) return false;
        if (typeof value === 'object' && value !== null) {
          return !Object.values(value).some(v => v === undefined);
        }
        return true;
      })
    );

    // Add updatedAt timestamp
    const finalUpdates = {
      ...cleanUpdates,
      updatedAt: new Date().toISOString()
    };

    console.log('API Route: Final updates to save:', finalUpdates);

    // Update the user document using server-side Firebase
    const userDocRef = doc(db, 'users', userId);
    await updateDoc(userDocRef, finalUpdates);

    console.log('API Route: Successfully updated user profile in Firebase');

    return NextResponse.json({ 
      success: true, 
      message: 'Profile updated successfully in Firebase',
      userId,
      updates: finalUpdates
    });

  } catch (error) {
    console.error('API Route: Error updating profile:', error);
    return NextResponse.json({ 
      error: 'Failed to update profile in Firebase',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 
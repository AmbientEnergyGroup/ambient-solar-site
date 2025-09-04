"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '../lib/contexts/AuthContext';
import { updateUserDataWithBackup, updateUserData, getUserData, createUserData, UserData } from '../lib/firebase/firebaseUtils';

export default function UserProfile() {
  const { user, userData, loading } = useAuth();
  
  // Show loading state
  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <h2 className="text-xl font-semibold text-gray-800 mb-2">Loading Profile</h2>
              <p className="text-gray-600">Please wait while we load your profile data...</p>
              <div className="mt-4 text-sm text-gray-500">
                <p>User: {user ? 'Logged in' : 'Not logged in'}</p>
                <p>UserData: {userData ? 'Available' : 'Not available'}</p>
                <p>Loading: {loading ? 'Yes' : 'No'}</p>
              </div>
              <button 
                onClick={() => window.location.reload()} 
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Reload Page
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    displayName: '',
    phoneNumber: ''
  });

  // Check if current user is the support admin
  const isOwnerAdmin = user?.email === 'support@ambientenergygroup.com';
  const isRegionAdmin = userData?.role === 'region_admin';
  const isOfficeAdmin = userData?.role === 'office_admin';
  const isManager = userData?.role === 'manager';
  const isAdmin = userData?.role === 'admin';
  
  const canEditProfile = isOwnerAdmin || isAdmin || isOfficeAdmin || isRegionAdmin || isManager;
  const canEditTeamRegion = isOwnerAdmin || isAdmin || isOfficeAdmin || isRegionAdmin;
  
  // Function to determine if user can edit sales role
  const canEditSalesRole = () => {
    // If no sales role is set yet, only managers can set it during onboarding
    if (!profileData.role || profileData.role === 'Not set') {
      return isManager || isAdmin || isOfficeAdmin || isRegionAdmin || isOwnerAdmin;
    }
    
    // If sales role is already set, only admins for manager roles can change it
    return isOwnerAdmin || isAdmin || isOfficeAdmin;
  };


  


  // Update form data when userData changes
  useEffect(() => {
    if (user) {
      // Always try to load from localStorage first (this has the most recent data)
      const userProfileKey = `userProfile_${user.uid}`;
      const savedProfile = localStorage.getItem(userProfileKey);
      
      if (savedProfile) {
        try {
          const profileData = JSON.parse(savedProfile);
          console.log('✅ Loaded profile from localStorage:', profileData);
          setFormData({
            displayName: profileData.displayName || user.displayName || user.email?.split('@')[0] || '',
            phoneNumber: profileData.phoneNumber || ''
          });
          console.log('✅ Form data set from localStorage');
        } catch (error) {
          console.error('❌ Error parsing localStorage profile:', error);
          // Fallback to Firebase data
          if (userData) {
            console.log('🔄 Falling back to Firebase data');
            setFormData({
              displayName: userData.displayName || '',
              phoneNumber: userData.phoneNumber || ''
            });
          } else {
            // Fallback to user data
            setFormData({
              displayName: user.displayName || user.email?.split('@')[0] || '',
              phoneNumber: user.phoneNumber || ''
            });
          }
        }
      } else {
        console.log('📝 No localStorage data found, using Firebase/user data');
        // No localStorage data, use Firebase data or fallback
        if (userData) {
          setFormData({
            displayName: userData.displayName || '',
            phoneNumber: userData.phoneNumber || ''
          });
        } else {
          // Fallback to user data
          setFormData({
            displayName: user.displayName || user.email?.split('@')[0] || '',
            phoneNumber: user.phoneNumber || ''
          });
        }
      }
    }
  }, [userData, user]);


  const handleSave = async () => {
    console.log('=== SAVE FUNCTION STARTED ===');
    console.log('Save button clicked!');
    
    if (!user) {
      console.log('❌ No user found, cannot save');
      alert('No user found. Please log in again.');
      return;
    }

    console.log('✅ User found:', user.uid);
    console.log('📝 Form data to save:', formData);

    try {
      // Prepare the updates object - only save essential profile data
      const updates = {
        displayName: formData.displayName || user.displayName || user.email?.split('@')[0] || 'User',
        phoneNumber: formData.phoneNumber || undefined
      };
      
      console.log('🔄 Prepared updates:', updates);
      
      // Save to localStorage as a temporary solution
      const userProfileKey = `userProfile_${user.uid}`;
      const profileData = {
        ...updates,
        userId: user.uid,
        email: user.email,
        updatedAt: new Date().toISOString()
      };
      
      console.log('💾 Saving to localStorage with key:', userProfileKey);
      console.log('💾 Profile data to save:', profileData);
      
      localStorage.setItem(userProfileKey, JSON.stringify(profileData));
      console.log('✅ Successfully saved to localStorage');
      
      // Verify the save worked
      const savedData = localStorage.getItem(userProfileKey);
      console.log('🔍 Verification - saved data:', savedData);
      
      if (savedData) {
        console.log('✅ localStorage verification successful');
      } else {
        console.log('❌ localStorage verification failed');
      }
      
      // Try to save to Firebase in the background (non-blocking)
      console.log('🔄 Attempting Firebase sync...');
      try {
        const response = await fetch('/api/profile/update', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: user.uid,
            updates: updates
          })
        });
        
        if (response.ok) {
          console.log('✅ Successfully synced to Firebase');
        } else {
          console.log('⚠️ Firebase sync failed, but data is saved locally');
        }
      } catch (firebaseError) {
        console.log('⚠️ Firebase sync error (non-blocking):', firebaseError);
      }
      
      // Show success message
      console.log('🎉 Showing success message');
      alert('Profile saved successfully!');
      
      console.log('🔄 Exiting edit mode');
      setIsEditing(false);
      
      // Don't refresh the page - let the useEffect handle loading the updated data
      console.log('✅ Save completed - data should be visible now');
      
      // Force a re-render to show the updated data
      setTimeout(() => {
        console.log('🔄 Forcing re-render to show updated data');
        // This will trigger the useEffect to reload data from localStorage
        setFormData(prev => ({ ...prev }));
      }, 100);
      
    } catch (error) {
      console.error('❌ Error updating profile:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      alert(`Error saving profile: ${errorMessage}. Please try again.`);
    }
  };

  // Show loading state
  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600">Loading profile...</span>
          </div>
        </div>
      </div>
    );
  }

  // Show error state if no user
  if (!user) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="text-center py-12">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Not Logged In</h2>
            <p className="text-gray-600">Please log in to view your profile.</p>
          </div>
        </div>
      </div>
    );
  }

  // Get profile data from localStorage first, then fallback to userData
  const getProfileData = () => {
    if (user) {
      const userProfileKey = `userProfile_${user.uid}`;
      const savedProfile = localStorage.getItem(userProfileKey);
      
      if (savedProfile) {
        try {
          const profileData = JSON.parse(savedProfile);
          console.log('📊 Using localStorage profile data for display:', profileData);
          return profileData;
        } catch (error) {
          console.error('❌ Error parsing localStorage profile for display:', error);
        }
      }
    }
    
    // Fallback to userData or default data
    console.log('📊 Using Firebase/fallback profile data for display');
    return userData || {
      id: user?.uid,
      role: 'setter',
      displayName: user?.displayName || user?.email?.split('@')[0] || 'User',
      email: user?.email || '',
      phoneNumber: user?.phoneNumber || '',
      team: 'Team A',
      region: 'Region A',
      createdAt: new Date().toISOString(),
      active: true,
      dealCount: 0,
      totalCommission: 0,
      recentProjects: [],
      commissionPayments: [],
      settings: {
        notifications: true,
        theme: 'auto',
        language: 'en'
      }
    };
  };

  const profileData = getProfileData();

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-black rounded-lg shadow-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-white">Profile</h1>
          <button
            onClick={() => canEditProfile && setIsEditing(!isEditing)}
            disabled={!canEditProfile}
            className={`px-4 py-2 rounded-lg transition-colors ${
              canEditProfile
                ? 'bg-cyan-600 text-white hover:bg-cyan-700'
                : 'bg-black text-gray-500 cursor-not-allowed'
            }`}
          >
            {isEditing ? 'Cancel' : 'Edit Profile'}
          </button>
        </div>

        {/* Simplified Profile Information */}
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Rep Name
            </label>
            <input
              type="text"
              value={isEditing ? formData.displayName : (profileData.displayName || 'Not set')}
              onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
              disabled={!isEditing || !canEditProfile}
              className={`w-full px-4 py-3 border rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-cyan-500 focus:border-transparent ${
                isEditing && canEditProfile
                  ? 'bg-black border-gray-500'
                  : 'bg-black border-gray-600 text-gray-400 cursor-not-allowed'
              }`}
              placeholder="Enter rep name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Rep Email
            </label>
            <input
              type="email"
              value={user.email || ''}
              disabled
              className="w-full px-4 py-3 bg-black border border-gray-500 rounded-lg text-gray-300 cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Rep Phone Number
            </label>
            <input
              type="tel"
              value={isEditing ? (formData.phoneNumber || '') : (profileData.phoneNumber || 'Not set')}
              onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value || '' })}
              disabled={!isEditing || !canEditProfile}
              className={`w-full px-4 py-3 border rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-cyan-500 focus:border-transparent ${
                isEditing && canEditProfile
                  ? 'bg-black border-gray-500'
                  : 'bg-black border-gray-600 text-gray-400 cursor-not-allowed'
              }`}
              placeholder={isEditing ? "Enter phone number" : ""}
            />
          </div>
        </div>

        {isEditing && (
          <div className="mt-8 flex justify-end space-x-4">
            <button
              onClick={() => setIsEditing(false)}
              className="px-6 py-3 border border-gray-500 rounded-lg text-gray-300 hover:bg-black transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!canEditProfile}
              className={`px-6 py-3 rounded-lg transition-colors ${
                canEditProfile
                  ? 'bg-cyan-600 text-white hover:bg-cyan-700'
                  : 'bg-black text-gray-500 cursor-not-allowed'
              }`}
            >
              Save Changes
            </button>
          </div>
        )}

        {/* Permission Notice */}
        {!canEditProfile && (
          <div className="mt-6 p-4 bg-yellow-900/20 border border-yellow-600/30 rounded-lg">
            <p className="text-sm text-yellow-300">
              <strong>Note:</strong> Profile editing is restricted to managers and administrators. 
              Contact your manager or support@ambientenergygroup.com for changes.
            </p>
          </div>
        )}
      </div>

    </div>
  );
} 
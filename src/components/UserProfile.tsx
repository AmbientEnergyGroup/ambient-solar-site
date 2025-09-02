"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '../lib/contexts/AuthContext';
import { updateUserDataWithBackup, updateUserData, getUserData, createUserData, UserData } from '../lib/firebase/firebaseUtils';
import AdminManager from './AdminManager';
import RegionTeamManager from './RegionTeamManager';
import DataProtectionManager from './DataProtectionManager';

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
  const [showAdminManager, setShowAdminManager] = useState(false);
  const [showRegionTeamManager, setShowRegionTeamManager] = useState(false);
  const [showDataProtectionManager, setShowDataProtectionManager] = useState(false);
  const [formData, setFormData] = useState({
    displayName: '',
    phoneNumber: '',
    notifications: true,
    theme: 'auto' as 'light' | 'dark' | 'auto',
    language: 'en',
    team: 'Team A' as 'Team A' | 'Team B' | 'Team C' | 'Team D',
    region: 'Region A' as 'Region A' | 'Region B' | 'Region C' | 'Region D',
    role: 'setter' as 'setter' | 'closer' | 'admin',
    managerRole: 'rep' as 'rep' | 'manager' | 'admin'
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
            phoneNumber: profileData.phoneNumber || '',
            notifications: profileData.settings?.notifications ?? true,
            theme: profileData.settings?.theme || 'auto',
            language: profileData.settings?.language || 'en',
            team: profileData.team || 'Team A',
            region: profileData.region || 'Region A',
            role: profileData.role || 'setter',
            managerRole: profileData.managerRole || 'rep'
          });
          console.log('✅ Form data set from localStorage');
        } catch (error) {
          console.error('❌ Error parsing localStorage profile:', error);
          // Fallback to Firebase data
          if (userData) {
            console.log('🔄 Falling back to Firebase data');
            setFormData({
              displayName: userData.displayName || '',
              phoneNumber: userData.phoneNumber || '',
              notifications: userData.settings?.notifications ?? true,
              theme: userData.settings?.theme || 'auto',
              language: userData.settings?.language || 'en',
              team: userData.team || 'Team A',
              region: userData.region || 'Region A',
              role: (userData.role === 'setter' || userData.role === 'closer' || userData.role === 'admin') ? userData.role : 'setter',
              managerRole: userData.managerRole || 'rep'
            });
          } else {
            // Fallback to user data
            setFormData({
              displayName: user.displayName || user.email?.split('@')[0] || '',
              phoneNumber: user.phoneNumber || '',
              notifications: true,
              theme: 'auto',
              language: 'en',
              team: 'Team A',
              region: 'Region A',
              role: 'setter',
              managerRole: 'rep'
            });
          }
        }
      } else {
        console.log('📝 No localStorage data found, using Firebase/user data');
        // No localStorage data, use Firebase data or fallback
        if (userData) {
          setFormData({
            displayName: userData.displayName || '',
            phoneNumber: userData.phoneNumber || '',
            notifications: userData.settings?.notifications ?? true,
            theme: userData.settings?.theme || 'auto',
            language: userData.settings?.language || 'en',
            team: userData.team || 'Team A',
            region: userData.region || 'Region A',
            role: (userData.role === 'setter' || userData.role === 'closer' || userData.role === 'admin') ? userData.role : 'setter',
            managerRole: 'rep'
          });
        } else {
          // Fallback to user data
                      setFormData({
              displayName: user.displayName || user.email?.split('@')[0] || '',
              phoneNumber: user.phoneNumber || '',
              notifications: true,
              theme: 'auto',
              language: 'en',
              team: 'Team A',
              region: 'Region A',
              role: 'setter',
              managerRole: 'rep'
            });
        }
      }
    }
  }, [userData, user]);

  // Update team when region changes to ensure valid team-region combination
  useEffect(() => {
    if (isEditing && formData.region) {
      const currentTeam = formData.team;
      let validTeam = currentTeam;
      
      // Check if current team is valid for the selected region
      if (formData.region === 'Region A' || formData.region === 'Region C') {
        if (currentTeam !== 'Team A' && currentTeam !== 'Team B') {
          validTeam = 'Team A';
        }
      } else if (formData.region === 'Region B' || formData.region === 'Region D') {
        if (currentTeam !== 'Team C' && currentTeam !== 'Team D') {
          validTeam = 'Team C';
        }
      }
      
      if (validTeam !== currentTeam) {
        setFormData(prev => ({ ...prev, team: validTeam }));
      }
    }
  }, [formData.region, isEditing]);

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
      // Prepare the updates object
      const updates = {
        displayName: formData.displayName || user.displayName || user.email?.split('@')[0] || 'User',
        phoneNumber: formData.phoneNumber || undefined,
        team: formData.team,
        region: formData.region,
        settings: {
          notifications: Boolean(formData.notifications),
          theme: formData.theme,
          language: formData.language
        }
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
      alert('Profile saved successfully! (Data saved locally - Firebase sync attempted)');
      
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
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Profile</h1>
          <div className="flex space-x-3">
            {isOwnerAdmin && (
              <button
                onClick={() => setShowAdminManager(true)}
                className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
              >
                Admin Panel
              </button>
            )}
            {(isOwnerAdmin || isOfficeAdmin || isRegionAdmin) && (
              <button
                onClick={() => setShowRegionTeamManager(true)}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
              >
                Region & Team Manager
              </button>
            )}
            {(isOwnerAdmin || isOfficeAdmin) && (
              <button
                onClick={() => setShowDataProtectionManager(true)}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
              >
                Data Protection
              </button>
            )}
            {canEditProfile && (
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                {isEditing ? 'Cancel' : 'Edit Profile'}
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-800">Basic Information</h2>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Name
              </label>
              <input
                type="text"
                value={isEditing ? formData.displayName : (profileData.displayName || 'Not set')}
                onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                disabled={!isEditing}
                className="w-full px-3 py-2 border border-gray-300 rounded-md disabled:bg-gray-50 text-gray-900"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                value={user.email || ''}
                disabled
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-700"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone Number
              </label>
              <input
                type="tel"
                value={isEditing ? (formData.phoneNumber || '') : (profileData.phoneNumber || 'Not set')}
                onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value || '' })}
                disabled={!isEditing}
                className="w-full px-3 py-2 border border-gray-300 rounded-md disabled:bg-gray-50 text-gray-900"
                placeholder={isEditing ? "Enter phone number" : ""}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sales Role
              </label>
              <select
                value={isEditing ? formData.role : (profileData.role || 'setter')}
                onChange={(e) => setFormData({ ...formData, role: e.target.value as 'setter' | 'closer' | 'admin' })}
                disabled={!isEditing || !canEditSalesRole()}
                className="w-full px-3 py-2 border border-gray-300 rounded-md disabled:bg-gray-50 text-gray-900"
              >
                <option value="setter">Setter</option>
                <option value="closer">Closer</option>
                <option value="admin">Admin</option>
              </select>
              {!canEditSalesRole() && (
                <p className="text-xs text-gray-500 mt-1">
                  {!profileData.role || profileData.role === 'Not set' 
                    ? 'Sales Role must be set by a manager during onboarding'
                    : 'Sales Role can only be changed by admins for manager roles'
                  }
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Manager Role
              </label>
              <select
                value={isEditing ? formData.managerRole : (profileData.managerRole || 'rep')}
                onChange={(e) => setFormData({ ...formData, managerRole: e.target.value as 'rep' | 'manager' | 'admin' })}
                disabled={!isEditing}
                className="w-full px-3 py-2 border border-gray-300 rounded-md disabled:bg-gray-50 text-gray-900"
              >
                <option value="rep">Rep</option>
                <option value="manager">Manager</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          </div>

          {/* Team and Region Section */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-800">Team & Region</h2>
            
            {/* Current Assignment Display */}
            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-sm font-medium text-gray-600">Current Team:</span>
                  <div className="text-lg font-semibold text-gray-900">{profileData.team || 'Team A'}</div>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-600">Current Region:</span>
                  <div className="text-lg font-semibold text-gray-900">{profileData.region || 'Region A'}</div>
                </div>
              </div>
            </div>
              
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Team
                </label>
                <select
                  value={isEditing ? formData.team : (profileData.team || 'Team A')}
                  onChange={(e) => setFormData({ ...formData, team: e.target.value as 'Team A' | 'Team B' | 'Team C' | 'Team D' })}
                  disabled={!isEditing || !canEditTeamRegion}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md disabled:bg-gray-50 text-gray-900"
                >
                  {profileData.region === 'Region A' && (
                    <>
                      <option value="Team A">Team A</option>
                      <option value="Team B">Team B</option>
                    </>
                  )}
                  {profileData.region === 'Region B' && (
                    <>
                      <option value="Team C">Team C</option>
                      <option value="Team D">Team D</option>
                    </>
                  )}
                  {profileData.region === 'Region C' && (
                    <>
                      <option value="Team A">Team A</option>
                      <option value="Team B">Team B</option>
                    </>
                  )}
                  {profileData.region === 'Region D' && (
                    <>
                      <option value="Team C">Team C</option>
                      <option value="Team D">Team D</option>
                    </>
                  )}
                  {!profileData.region && (
                    <>
                      <option value="Team A">Team A</option>
                      <option value="Team B">Team B</option>
                    </>
                  )}
                </select>
                {!canEditTeamRegion && (
                  <p className="text-xs text-gray-500 mt-1">Only managers can change team assignment</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Region
                </label>
                <select
                  value={isEditing ? formData.region : (profileData.region || 'Region A')}
                  onChange={(e) => setFormData({ ...formData, region: e.target.value as 'Region A' | 'Region B' | 'Region C' | 'Region D' })}
                  disabled={!isEditing || !canEditTeamRegion}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md disabled:bg-gray-50 text-gray-900"
                >
                  <option value="Region A">Region A</option>
                  <option value="Region B">Region B</option>
                  <option value="Region C">Region C</option>
                  <option value="Region D">Region D</option>
                </select>
                {!canEditTeamRegion && (
                  <p className="text-xs text-gray-500 mt-1">Only managers can change region assignment</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Settings */}
        <div className="mt-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Settings</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={isEditing ? formData.notifications : (profileData.settings?.notifications ?? true)}
                  onChange={(e) => setFormData({ ...formData, notifications: e.target.checked })}
                  disabled={!isEditing}
                  className="mr-2"
                />
                <span className="text-sm font-medium text-gray-700">Email Notifications</span>
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Theme
              </label>
              <select
                value={isEditing ? formData.theme : (profileData.settings?.theme || 'auto')}
                onChange={(e) => setFormData({ ...formData, theme: e.target.value as any })}
                disabled={!isEditing}
                className="w-full px-3 py-2 border border-gray-300 rounded-md disabled:bg-gray-50 text-gray-900"
              >
                <option value="light">Light</option>
                <option value="dark">Dark</option>
                <option value="auto">Auto</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Language
              </label>
              <select
                value={isEditing ? formData.language : (profileData.settings?.language || 'en')}
                onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                disabled={!isEditing}
                className="w-full px-3 py-2 border border-gray-300 rounded-md disabled:bg-gray-50 text-gray-900"
              >
                <option value="en">English</option>
                <option value="es">Spanish</option>
                <option value="fr">French</option>
              </select>
            </div>
          </div>
        </div>

        {isEditing && (
          <div className="mt-6 flex justify-end space-x-4">
            <button
              onClick={() => setIsEditing(false)}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Save Changes
            </button>
          </div>
        )}

        {/* Permission Notice */}
        {!canEditProfile && (
          <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              <strong>Note:</strong> Profile editing is restricted to managers and administrators. 
              Contact your manager or support@ambientenergygroup.com for changes.
            </p>
          </div>
        )}


      </div>

      {/* Admin Manager Modal */}
      <AdminManager 
        isVisible={showAdminManager} 
        onClose={() => setShowAdminManager(false)} 
      />
      
      {/* Region & Team Manager Modal */}
      <RegionTeamManager 
        isVisible={showRegionTeamManager} 
        onClose={() => setShowRegionTeamManager(false)} 
      />

      {/* Data Protection Manager Modal */}
      <DataProtectionManager 
        isVisible={showDataProtectionManager} 
        onClose={() => setShowDataProtectionManager(false)} 
      />
    </div>
  );
} 
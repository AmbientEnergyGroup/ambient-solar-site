"use client";

import React, { useState } from "react";
import { useAuth } from "@/lib/contexts/AuthContext";
import { useTheme } from "@/lib/hooks/useTheme";
import { 
  User, 
  Settings, 
  Bell, 
  Users, 
  Building, 
  FileText,
  ChevronRight,
  Edit3,
  Save,
  X
} from "lucide-react";
import AmbientLogo from "@/components/AmbientLogo";
import MessagesButton from "@/components/MessagesButton";
import Sidebar from "@/components/Sidebar";
import UserProfile from '../../components/UserProfile';
import AuthDiagnostic from '../../components/AuthDiagnostic';
import RepAgreement from '../../components/RepAgreement';

export default function AccountPage() {
  const auth = useAuth();
  const { user, loading, signOut, userData } = auth || {};
  const { darkMode, toggleTheme } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [repType, setRepType] = useState<'setter' | 'closer'>(userData?.role === 'setter' || userData?.role === 'closer' ? userData.role : 'setter');
  const [payType, setPayType] = useState<'rookie' | 'vet' | 'pro'>(userData?.payType === 'Rookie' ? 'rookie' : userData?.payType === 'Vet' ? 'vet' : userData?.payType === 'Pro' ? 'pro' : 'rookie');
  const [managerType, setManagerType] = useState<'Team Lead' | 'Manager' | 'Area Manager' | 'Regional' | ''>(userData?.managerType || '');
  const [operationsPrivilege, setOperationsPrivilege] = useState<boolean>(userData?.operationsPrivilege || false);
  const [organizationBuildingPrivileges, setOrganizationBuildingPrivileges] = useState<boolean>(userData?.organizationBuildingPrivileges || false);
  const [isSaving, setIsSaving] = useState(false);

  // Check if current user is the support admin
  const isOwnerAdmin = user?.email === 'support@ambientenergygroup.com';

  // Update state when userData changes
  React.useEffect(() => {
    if (userData) {
      if (userData.role === 'setter' || userData.role === 'closer') {
        setRepType(userData.role);
      }
      if (userData.payType === 'Rookie') {
        setPayType('rookie');
      } else if (userData.payType === 'Vet') {
        setPayType('vet');
      } else if (userData.payType === 'Pro') {
        setPayType('pro');
      }
      if (userData.managerType) {
        setManagerType(userData.managerType);
      }
      if (typeof userData.operationsPrivilege === 'boolean') {
        setOperationsPrivilege(userData.operationsPrivilege);
      }
      if (typeof userData.organizationBuildingPrivileges === 'boolean') {
        setOrganizationBuildingPrivileges(userData.organizationBuildingPrivileges);
      }
    }
  }, [userData]);

  const handleSaveRepType = async () => {
    if (!user || !isOwnerAdmin) return;
    
    setIsSaving(true);
    try {
      const response = await fetch('/api/profile/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.uid,
          updates: { role: repType }
        })
      });
      
      if (response.ok) {
        alert('RepType updated successfully!');
      } else {
        alert('Failed to update RepType. Please try again.');
      }
    } catch (error) {
      console.error('Error updating RepType:', error);
      alert('Error updating RepType. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSavePayType = async () => {
    if (!user) return;
    
    setIsSaving(true);
    try {
      const response = await fetch('/api/profile/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.uid,
          updates: { payType: payType.charAt(0).toUpperCase() + payType.slice(1) }
        })
      });
      
      if (response.ok) {
        alert('PayType updated successfully!');
      } else {
        alert('Failed to update PayType. Please try again.');
      }
    } catch (error) {
      console.error('Error updating PayType:', error);
      alert('Error updating PayType. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveManagerType = async () => {
    if (!user || !isOwnerAdmin) return;
    
    setIsSaving(true);
    try {
      const response = await fetch('/api/profile/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.uid,
          updates: { managerType: managerType }
        })
      });
      
      if (response.ok) {
        alert('Manager Type updated successfully!');
      } else {
        alert('Failed to update Manager Type. Please try again.');
      }
    } catch (error) {
      console.error('Error updating Manager Type:', error);
      alert('Error updating Manager Type. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveOperationsPrivilege = async (value: boolean) => {
    if (!user || !isOwnerAdmin) return;
    
    setIsSaving(true);
    try {
      const response = await fetch('/api/profile/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.uid,
          updates: { operationsPrivilege: value }
        })
      });
      
      if (response.ok) {
        setOperationsPrivilege(value);
        alert('Operations Privilege updated successfully!');
      } else {
        alert('Failed to update Operations Privilege. Please try again.');
      }
    } catch (error) {
      console.error('Error updating Operations Privilege:', error);
      alert('Error updating Operations Privilege. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveOrganizationBuildingPrivileges = async (value: boolean) => {
    if (!user || !isOwnerAdmin) return;
    
    setIsSaving(true);
    try {
      const response = await fetch('/api/profile/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.uid,
          updates: { organizationBuildingPrivileges: value }
        })
      });
      
      if (response.ok) {
        setOrganizationBuildingPrivileges(value);
        alert('Organization Building Privileges updated successfully!');
      } else {
        alert('Failed to update Organization Building Privileges. Please try again.');
      }
    } catch (error) {
      console.error('Error updating Organization Building Privileges:', error);
      alert('Error updating Organization Building Privileges. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500 mx-auto mb-4"></div>
          <p className="text-gray-300">Loading account settings...</p>
        </div>
      </div>
    );
  }

  // If user is not authenticated and not loading, this will render briefly before redirect
  if (!user) {
    return null;
  }

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  interface Tab {
    id: string;
    name: string;
    icon: any;
    description: string;
    status?: 'coming-soon';
  }

  const tabs: Tab[] = [
    { id: 'profile', name: 'Profile', icon: User, description: 'Personal information and basic settings' },
    { id: 'account-types', name: 'Account Types', icon: Users, description: 'Manage user roles and permissions' },
    { id: 'upline', name: 'Upline', icon: Users, description: 'View your management hierarchy' },
    { id: 'notifications', name: 'Notifications', icon: Bell, description: 'Email, push, and SMS notification preferences', status: 'coming-soon' },
    { id: 'advanced', name: 'Advanced', icon: Settings, description: 'Developer options and diagnostics', status: 'coming-soon' }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'profile':
        return <UserProfile />;
      case 'account-types':
        return (
          <div className="space-y-6">
            <div className="bg-black rounded-lg p-6 border border-gray-500">
              <div className="mb-6">
                <h3 className="text-xl font-semibold text-white mb-2">RepType & PayType</h3>
                <p className="text-gray-300">Manage your sales role and pay classification</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* RepType Section */}
                <div className="bg-black rounded-lg p-4 border border-gray-500">
                  <div className="flex items-center mb-4">
                    <div className="h-10 w-10 bg-cyan-500/20 rounded-lg flex items-center justify-center mr-3">
                      <User className="h-5 w-5 text-cyan-400" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-white">RepType</h4>
                      <p className="text-sm text-gray-400">Your sales role type</p>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Current RepType
                      </label>
                      <div className="px-3 py-2 bg-black border border-gray-600 rounded-lg text-white">
                        {repType === 'setter' ? 'Appointment Setter' : 
                         repType === 'closer' ? 'Appointment Closer' : 
                         'Not Set'}
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Change RepType {isOwnerAdmin ? '(Admin Only)' : '(Read Only)'}
                      </label>
                      <div className="flex space-x-2">
                        <select 
                          className={`flex-1 px-3 py-2 border rounded-lg text-white focus:ring-2 focus:ring-cyan-500 focus:border-transparent ${
                            isOwnerAdmin 
                              ? 'bg-black border-gray-600' 
                              : 'bg-black border-gray-700 text-gray-500 cursor-not-allowed'
                          }`}
                          value={repType}
                          onChange={(e) => setRepType(e.target.value as 'setter' | 'closer')}
                          disabled={!isOwnerAdmin}
                        >
                          <option value="setter">Appointment Setter</option>
                          <option value="closer">Appointment Closer</option>
                        </select>
                        <button
                          onClick={handleSaveRepType}
                          disabled={isSaving || !isOwnerAdmin}
                          className={`px-4 py-2 rounded-lg transition-colors ${
                            isOwnerAdmin
                              ? 'bg-cyan-600 text-white hover:bg-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed'
                              : 'bg-black text-gray-500 cursor-not-allowed'
                          }`}
                        >
                          {isSaving ? 'Saving...' : 'Save'}
                        </button>
                      </div>
                    </div>
                    
                    {!isOwnerAdmin && (
                      <p className="text-xs text-gray-400">
                        RepType can only be changed by an administrator
                      </p>
                    )}
                  </div>
                </div>

                {/* PayType Section */}
                <div className="bg-black rounded-lg p-4 border border-gray-500">
                  <div className="flex items-center mb-4">
                    <div className="h-10 w-10 bg-green-500/20 rounded-lg flex items-center justify-center mr-3">
                      <Building className="h-5 w-5 text-green-400" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-white">PayType</h4>
                      <p className="text-sm text-gray-400">Your pay classification</p>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Current PayType
                      </label>
                      <div className="px-3 py-2 bg-black border border-gray-600 rounded-lg text-white">
                        {repType === 'closer' ? 'Standard' : 
                         payType || 'Not Set'}
                      </div>
                    </div>
                    
                    {repType === 'setter' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Change PayType {isOwnerAdmin ? '(Admin Only)' : '(Read Only)'}
                        </label>
                        <div className="flex space-x-2">
                          <select 
                            className={`flex-1 px-3 py-2 border rounded-lg text-white focus:ring-2 focus:ring-cyan-500 focus:border-transparent ${
                              isOwnerAdmin 
                                ? 'bg-black border-gray-600' 
                                : 'bg-black border-gray-700 text-gray-500 cursor-not-allowed'
                            }`}
                            value={payType}
                            onChange={(e) => setPayType(e.target.value as 'rookie' | 'vet' | 'pro')}
                            disabled={!isOwnerAdmin}
                          >
                            <option value="rookie">Rookie</option>
                            <option value="vet">Vet</option>
                            <option value="pro">Pro</option>
                          </select>
                          <button
                            onClick={handleSavePayType}
                            disabled={isSaving || !isOwnerAdmin}
                            className={`px-4 py-2 rounded-lg transition-colors ${
                              isOwnerAdmin
                                ? 'bg-cyan-600 text-white hover:bg-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed'
                                : 'bg-black text-gray-500 cursor-not-allowed'
                            }`}
                          >
                            {isSaving ? 'Saving...' : 'Save'}
                          </button>
                        </div>
                        {!isOwnerAdmin && (
                          <p className="text-xs text-gray-400 mt-2">
                            PayType can only be changed by an administrator
                          </p>
                        )}
                      </div>
                    )}
                    
                    {repType === 'closer' && (
                      <p className="text-xs text-gray-400">
                        Closers automatically have "Standard" pay type
                      </p>
                    )}
                  </div>
                </div>

                {/* Manager Type Section */}
                <div className="bg-black rounded-lg p-4 border border-gray-500">
                  <div className="flex items-center mb-4">
                    <div className="h-10 w-10 bg-purple-500/20 rounded-lg flex items-center justify-center mr-3">
                      <Users className="h-5 w-5 text-purple-400" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-white">Manager Type</h4>
                      <p className="text-sm text-gray-400">Your management level</p>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Current Manager Type
                      </label>
                      <div className="px-3 py-2 bg-black border border-gray-600 rounded-lg text-white">
                        {managerType || 'Not Set'}
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Change Manager Type {isOwnerAdmin ? '(Admin Only)' : '(Read Only)'}
                      </label>
                      <div className="flex space-x-2">
                        <select 
                          className={`flex-1 px-3 py-2 border rounded-lg text-white focus:ring-2 focus:ring-cyan-500 focus:border-transparent ${
                            isOwnerAdmin 
                              ? 'bg-black border-gray-600' 
                              : 'bg-black border-gray-700 text-gray-500 cursor-not-allowed'
                          }`}
                          value={managerType}
                          onChange={(e) => setManagerType(e.target.value as 'Team Lead' | 'Manager' | 'Area Manager' | 'Regional' | '')}
                          disabled={!isOwnerAdmin}
                        >
                          <option value="">Select Manager Type</option>
                          <option value="Team Lead">Team Lead</option>
                          <option value="Manager">Manager</option>
                          <option value="Area Manager">Area Manager</option>
                          <option value="Regional">Regional</option>
                        </select>
                        <button
                          onClick={handleSaveManagerType}
                          disabled={!isOwnerAdmin || isSaving}
                          className={`px-4 py-2 rounded-lg transition-colors ${
                            isOwnerAdmin
                              ? 'bg-cyan-600 text-white hover:bg-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed'
                              : 'bg-black text-gray-500 cursor-not-allowed'
                          }`}
                        >
                          {isSaving ? 'Saving...' : 'Save'}
                        </button>
                      </div>
                      {!isOwnerAdmin && (
                        <p className="text-xs text-gray-400 mt-2">
                          Manager Type can only be changed by an administrator
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Privileges Section */}
                <div className="bg-black rounded-lg p-4 border border-gray-500">
                  <div className="flex items-center mb-4">
                    <div className="h-10 w-10 bg-orange-500/20 rounded-lg flex items-center justify-center mr-3">
                      <Users className="h-5 w-5 text-orange-400" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-white">Privileges</h4>
                      <p className="text-sm text-gray-400">System access permissions</p>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Operations Privilege
                      </label>
                      <div className="flex items-center space-x-4">
                        <div className="px-3 py-2 bg-black border border-gray-600 rounded-lg text-white min-w-[60px] text-center">
                          {operationsPrivilege ? 'Yes' : 'No'}
                        </div>
                        {isOwnerAdmin && (
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleSaveOperationsPrivilege(true)}
                              disabled={isSaving}
                              className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                              Yes
                            </button>
                            <button
                              onClick={() => handleSaveOperationsPrivilege(false)}
                              disabled={isSaving}
                              className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                              No
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Organization Building Privileges
                      </label>
                      <div className="flex items-center space-x-4">
                        <div className="px-3 py-2 bg-black border border-gray-600 rounded-lg text-white min-w-[60px] text-center">
                          {organizationBuildingPrivileges ? 'Yes' : 'No'}
                        </div>
                        {isOwnerAdmin && (
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleSaveOrganizationBuildingPrivileges(true)}
                              disabled={isSaving}
                              className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                              Yes
                            </button>
                            <button
                              onClick={() => handleSaveOrganizationBuildingPrivileges(false)}
                              disabled={isSaving}
                              className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                              No
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {!isOwnerAdmin && (
                      <p className="text-xs text-gray-400">
                        Privileges can only be changed by an administrator
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      case 'upline':
        return (
          <div className="space-y-6">
            <div className="bg-black rounded-lg p-6 border border-gray-500">
              <h3 className="text-xl font-semibold text-white mb-4">Management Hierarchy</h3>
              <p className="text-gray-300 mb-6">View your management structure and upline contacts</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Team Lead Box */}
                <div className="bg-black rounded-lg p-4 border border-gray-500">
                  <div className="flex items-center mb-3">
                    <div className="h-10 w-10 bg-blue-500/20 rounded-lg flex items-center justify-center mr-3">
                      <Users className="h-5 w-5 text-blue-400" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-white">Team Lead</h4>
                      <p className="text-sm text-gray-400">Direct supervisor</p>
                    </div>
                  </div>
                  <div className="text-gray-300">
                    <p className="text-sm">Name: <span className="text-white">Not Assigned</span></p>
                    <p className="text-sm">Email: <span className="text-white">-</span></p>
                    <p className="text-sm">Phone: <span className="text-white">-</span></p>
                  </div>
                </div>

                {/* Manager Box */}
                <div className="bg-black rounded-lg p-4 border border-gray-500">
                  <div className="flex items-center mb-3">
                    <div className="h-10 w-10 bg-green-500/20 rounded-lg flex items-center justify-center mr-3">
                      <Users className="h-5 w-5 text-green-400" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-white">Manager</h4>
                      <p className="text-sm text-gray-400">Department manager</p>
                    </div>
                  </div>
                  <div className="text-gray-300">
                    <p className="text-sm">Name: <span className="text-white">Not Assigned</span></p>
                    <p className="text-sm">Email: <span className="text-white">-</span></p>
                    <p className="text-sm">Phone: <span className="text-white">-</span></p>
                  </div>
                </div>

                {/* Area Manager Box */}
                <div className="bg-black rounded-lg p-4 border border-gray-500">
                  <div className="flex items-center mb-3">
                    <div className="h-10 w-10 bg-purple-500/20 rounded-lg flex items-center justify-center mr-3">
                      <Users className="h-5 w-5 text-purple-400" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-white">Area Manager</h4>
                      <p className="text-sm text-gray-400">Regional area manager</p>
                    </div>
                  </div>
                  <div className="text-gray-300">
                    <p className="text-sm">Name: <span className="text-white">Not Assigned</span></p>
                    <p className="text-sm">Email: <span className="text-white">-</span></p>
                    <p className="text-sm">Phone: <span className="text-white">-</span></p>
                  </div>
                </div>

                {/* Regional Box */}
                <div className="bg-black rounded-lg p-4 border border-gray-500">
                  <div className="flex items-center mb-3">
                    <div className="h-10 w-10 bg-orange-500/20 rounded-lg flex items-center justify-center mr-3">
                      <Users className="h-5 w-5 text-orange-400" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-white">Regional</h4>
                      <p className="text-sm text-gray-400">Regional manager</p>
                    </div>
                  </div>
                  <div className="text-gray-300">
                    <p className="text-sm">Name: <span className="text-white">Not Assigned</span></p>
                    <p className="text-sm">Email: <span className="text-white">-</span></p>
                    <p className="text-sm">Phone: <span className="text-white">-</span></p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      case 'notifications':
        return (
          <div className="space-y-6">
            <div className="bg-black rounded-lg p-12 border border-gray-500 text-center">
              <Bell className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-2xl font-semibold text-white mb-2">Notifications</h3>
              <p className="text-gray-300 mb-6">Notification preferences are coming soon</p>
              <div className="inline-flex items-center px-4 py-2 bg-black text-gray-300 rounded-lg">
                <span className="text-sm">In Development</span>
              </div>
            </div>
          </div>
        );
      case 'advanced':
        return (
          <div className="space-y-6">
            <div className="bg-black rounded-lg p-12 border border-gray-500 text-center">
              <Settings className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-2xl font-semibold text-white mb-2">Advanced Settings</h3>
              <p className="text-gray-300 mb-6">Developer options and diagnostics are coming soon</p>
              <div className="inline-flex items-center px-4 py-2 bg-black text-gray-300 rounded-lg">
                <span className="text-sm">In Development</span>
              </div>
            </div>
          </div>
        );
      default:
        return <UserProfile />;
    }
  };

  return (
    <div className="min-h-screen bg-black flex">
      <Sidebar 
        signOut={handleSignOut} 
        darkMode={darkMode} 
        sidebarOpen={sidebarOpen} 
        setSidebarOpen={setSidebarOpen} 
      />
      
      <div className={`flex-1 flex flex-col overflow-hidden transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-0'}`}>
        {/* Header */}
        <header className="bg-black border-b border-gray-600 px-6 py-4 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <div className="flex items-center space-x-3">
                <div className="h-8 w-8 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg flex items-center justify-center">
                  <Settings className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-white">Account Settings</h1>
                  <p className="text-sm text-gray-400">Manage your account preferences and settings</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <MessagesButton />
              <button
                onClick={toggleTheme}
                className="p-2 rounded-lg bg-black hover:bg-black text-gray-300 transition-colors"
              >
                {darkMode ? '☀️' : '🌙'}
              </button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Sidebar Navigation */}
          <div className="w-64 bg-black border-r border-gray-600 flex-shrink-0">
            <nav className="p-4 space-y-2">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isComingSoon = tab.status === 'coming-soon';
                return (
                  <button
                    key={tab.id}
                    onClick={() => !isComingSoon && setActiveTab(tab.id)}
                    disabled={isComingSoon}
                    className={`w-full flex items-center px-3 py-3 rounded-lg text-left transition-colors ${
                      isComingSoon
                        ? 'bg-black text-gray-400 cursor-not-allowed'
                        : activeTab === tab.id
                        ? 'bg-cyan-600 text-white'
                        : 'text-gray-300 hover:bg-black hover:text-white'
                    }`}
                  >
                    <Icon className={`h-5 w-5 mr-3 flex-shrink-0 ${isComingSoon ? 'text-gray-400' : ''}`} />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium flex items-center">
                        {tab.name}
                        {isComingSoon && (
                          <span className="ml-2 px-2 py-1 text-xs bg-black text-gray-300 rounded-full">
                            Coming Soon
                          </span>
                        )}
                      </div>
                      <div className="text-xs opacity-75 truncate">{tab.description}</div>
                    </div>
                    {!isComingSoon && <ChevronRight className="h-4 w-4 flex-shrink-0" />}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Content Area */}
          <main className="flex-1 overflow-auto p-6">
            {renderTabContent()}
          </main>
        </div>
      </div>
    </div>
  );
} 
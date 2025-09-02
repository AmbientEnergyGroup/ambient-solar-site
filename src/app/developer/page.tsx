"use client";

import { useState, useEffect } from "react";
import MessagesButton from "@/components/MessagesButton";

import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/contexts/AuthContext";
import { Code, LogOut, Home, Cpu, Database, FileCode, Settings, Terminal, X, Server, Eye, EyeOff, Users, Clock, Activity, UserPlus, Check, UserX, Shield, Edit, RefreshCw, Key, Trash } from "lucide-react";
import AmbientLogo from "@/components/AmbientLogo";
import Sidebar from "@/components/Sidebar";
import { useTheme } from "@/lib/hooks/useTheme";

// Interface for extended user data
interface UserData {
  id: string;
  role: 'admin' | 'setter' | 'closer' | 'manager';
  displayName: string;
  email: string;
  phoneNumber?: string;
  createdAt: string;
  managerId?: string;
  active: boolean;
  payType?: string;  // Added for pay type (Intern Rep, Veteran Rep, Pro Rep)
  userRole?: string; // Added for user role (Setter, Closer, Self Gen)
  managerName?: string;
}

export default function DeveloperConsole() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [showLogsPanel, setShowLogsPanel] = useState(true);
  const [logs, setLogs] = useState<string[]>([
    "[System] Developer console loaded",
    "[Config] Environment: Production",
    "[Auth] Developer access granted",
    "[Database] Connection established"
  ]);
  
  // Access control
  const [accessCode, setAccessCode] = useState("");
  const [showAccessCodeModal, setShowAccessCodeModal] = useState(false);
  const [accessVerified, setAccessVerified] = useState(false);
  const DEVELOPER_ACCESS_CODE = "ambient2024"; // Original access code
  
  // User management state
  const [users, setUsers] = useState<UserData[]>([]);
  const [userSearch, setUserSearch] = useState("");
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [showResetDataModal, setShowResetDataModal] = useState(false);
  const [showEditUserModal, setShowEditUserModal] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  
  const [newUserData, setNewUserData] = useState({
    email: "",
    displayName: "",
    phoneNumber: "",
    role: "user" as 'admin' | 'user',
    password: ""
  });
  
  const [editUserData, setEditUserData] = useState({
    displayName: "",
    role: "user" as 'admin' | 'user',
    active: true,
    payType: "Intern Rep",
    userRole: "Setter",
    managerName: "Asher Crosby"
  });
  
  // State for invitation link display
  const [invitationLink, setInvitationLink] = useState<string | null>(null);
  const [showInvitationSuccess, setShowInvitationSuccess] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  
  const auth = useAuth();
  const { user, userData, loading, signOut, signUpWithEmail, updateUserRole, updateUserActive, isAdmin } = auth || {};
  const router = useRouter();
  const { darkMode } = useTheme();

  // Add a log entry
  const addLog = (message: string) => {
    setLogs(prev => [...prev, message]);
  };

  // Clear logs
  const clearLogs = () => {
    setLogs([]);
    addLog("[System] Logs cleared");
  };

  // Load all users
  const loadUsers = () => {
    try {
      const userList: UserData[] = [];
      const userMap: {[id: string]: UserData} = {};
      
      // Load all basic user data from localStorage
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('userData_')) {
          try {
            const userId = key.replace('userData_', '');
            const userData = JSON.parse(localStorage.getItem(key) || '{}');
            
            // Ensure all required fields exist
            userData.id = userId;
            userData.role = userData.role || 'user';
            userData.active = userData.active !== false; // default to active
            userData.createdAt = userData.createdAt || new Date().toISOString();
            
            userMap[userId] = userData;
          } catch (error) {
            console.error('Error parsing user data', error);
          }
        }
      }
      
      // Convert map to array
      for (const userId in userMap) {
        userList.push(userMap[userId]);
      }
      
      setUsers(userList);
      addLog(`[Users] Loaded ${userList.length} users`);
    } catch (error) {
      addLog(`[Error] Failed to load users: ${error}`);
    }
  };
  
  // Reset user data
  const resetUserData = (userId: string) => {
    try {
      // Get data related to this user
      const projectsJSON = localStorage.getItem('projects');
      const setsJSON = localStorage.getItem('customerSets');
      
      if (projectsJSON) {
        const allProjects = JSON.parse(projectsJSON);
        const filteredProjects = allProjects.filter((project: any) => project.userId !== userId);
        localStorage.setItem('projects', JSON.stringify(filteredProjects));
      }
      
      if (setsJSON) {
        const allSets = JSON.parse(setsJSON);
        const filteredSets = allSets.filter((set: any) => set.userId !== userId);
        localStorage.setItem('customerSets', JSON.stringify(filteredSets));
      }
      
      addLog(`[Users] Reset data for user ${userId}`);
    } catch (error) {
      addLog(`[Error] Failed to reset user data: ${error}`);
    }
  };
  
  // Handle adding a new user
  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Instead of directly creating the user, generate a signup invitation
      const inviteId = `invite_${Date.now()}`;
      const inviteData = {
        email: newUserData.email,
        displayName: newUserData.displayName,
        role: newUserData.role,
        createdAt: new Date().toISOString(),
        expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days expiry
      };
      
      // Save invitation to localStorage
      localStorage.setItem(`invite_${inviteId}`, JSON.stringify(inviteData));
      
      // Generate invitation link (using relative URL that works in any environment)
      const fullInvitationLink = `/signup?inviteId=${inviteId}`;
      setInvitationLink(fullInvitationLink);
      
      // Log as if we're sending an email (for demo purposes)
      console.log(`
        TO: ${newUserData.email}
        SUBJECT: Invitation to join Ambient Pro
        
        Hello ${newUserData.displayName},
        
        You have been invited to join Ambient Pro. Click the link below to create your account:
        
        ${window.location.origin}${fullInvitationLink}
        
        This invitation will expire in 7 days.
        
        Best regards,
        Ambient Pro Team
      `);
      
      addLog(`[Users] Created invitation for: ${newUserData.email}`);
      
      // Close modal and show success screen
      setShowAddUserModal(false);
      setShowInvitationSuccess(true);
      
      // Reset form data
      setNewUserData({
        email: "",
        displayName: "",
        phoneNumber: "",
        role: "user",
        password: ""
      });
      
    } catch (error) {
      addLog(`[Error] Failed to create invitation: ${error}`);
    }
  };
  
  // Handle copying invitation link to clipboard
  const copyInvitationLink = async () => {
    if (invitationLink) {
      try {
        const absoluteLink = `${window.location.origin}${invitationLink}`;
        await navigator.clipboard.writeText(absoluteLink);
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
      } catch (err) {
        console.error('Failed to copy link', err);
        addLog(`[Error] Failed to copy invitation link: ${err}`);
      }
    }
  };
  
  // Handle editing a user
  const handleEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedUserId) return;
    
    try {
      // Update user role if changed
      await updateUserRole(selectedUserId, editUserData.role as 'admin' | 'setter' | 'closer' | 'manager');
      
      // Update active status if changed
      const userData = users.find(u => u.id === selectedUserId);
      if (userData) {
        // Check if active status changed
        if (userData.active !== editUserData.active) {
          await updateUserActive(selectedUserId, editUserData.active);
          
          // If deactivating user, reset their data
          if (!editUserData.active) {
            resetUserData(selectedUserId);
          }
        }
        
        // Update pay type and user role in localStorage
        const userDataKey = `userData_${selectedUserId}`;
        const storedUserData = localStorage.getItem(userDataKey);
        if (storedUserData) {
          const parsedUserData = JSON.parse(storedUserData);
          
          // Check if role changed and update currentUser if it's the current user
          const isCurrentUser = user && user.uid === selectedUserId;
          
          // If the user's role changed to/from admin, update localStorage
          if (parsedUserData.role !== editUserData.role) {
            parsedUserData.role = editUserData.role;
            
            // If this is the current user and their admin status changed
            if (isCurrentUser) {
              // Update the current user in localStorage
              const currentUserString = localStorage.getItem('currentUser');
              if (currentUserString) {
                const currentUser = JSON.parse(currentUserString);
                currentUser.role = editUserData.role;
                localStorage.setItem('currentUser', JSON.stringify(currentUser));
                
                // If they're being revoked admin, clear their access verification
                if (editUserData.role !== 'admin') {
                  localStorage.removeItem('developerAccessVerified');
                  addLog("[Admin] User admin access revoked");
                } else {
                  // If they're being granted admin, automatically grant access
                  localStorage.setItem('developerAccessVerified', 'true');
                  addLog("[Admin] User granted admin access");
                }
              }
            }
          }
          
          // Update other fields
          parsedUserData.payType = editUserData.payType;
          parsedUserData.userRole = editUserData.userRole;
          parsedUserData.managerName = editUserData.managerName;
          
          localStorage.setItem(userDataKey, JSON.stringify(parsedUserData));
          
          // Also update in other locations for consistency
          localStorage.setItem(`userRole_${selectedUserId}`, editUserData.userRole);
          localStorage.setItem(`payType_${selectedUserId}`, editUserData.payType);
          localStorage.setItem(`managerName_${selectedUserId}`, editUserData.managerName);
          
          // Add log message about role change if applicable
          if (parsedUserData.role !== userData.role) {
            const username = parsedUserData.displayName || parsedUserData.email || "User";
            addLog(`[Users] ${username}'s role changed to ${parsedUserData.role}`);
          }
        }
      }
      
      setShowEditUserModal(false);
      setSelectedUserId(null);
      
      // Reload user list
      loadUsers();
      
      addLog(`[Users] Updated user: ${selectedUserId}`);
    } catch (error) {
      addLog(`[Error] Failed to update user: ${error}`);
    }
  };
  
  // Handle deleting a user
  const handleDeleteUser = async (userId: string) => {
    if (!confirm("Are you sure you want to delete this user? All their data will be permanently removed.")) {
      return;
    }
    
    try {
      // Remove user data
      localStorage.removeItem(`userData_${userId}`);
      
      // Reset user's data
      resetUserData(userId);
      
      // Reload user list
      loadUsers();
      
      addLog(`[Users] Deleted user: ${userId}`);
    } catch (error) {
      addLog(`[Error] Failed to delete user: ${error}`);
    }
  };

  // Verify access code
  const verifyAccessCode = () => {
    if (accessCode === DEVELOPER_ACCESS_CODE) {
      setAccessVerified(true);
      setShowAccessCodeModal(false);
      // Save verification status to localStorage
      localStorage.setItem('developerAccessVerified', 'true');
      addLog("[Auth] Access code verified");
    } else {
      addLog("[Auth] Invalid access code");
      // Shake the input to indicate error
      const inputElement = document.getElementById('access-code-input');
      if (inputElement) {
        inputElement.classList.add('shake-animation');
        setTimeout(() => {
          inputElement.classList.remove('shake-animation');
        }, 500);
      }
    }
  };

  // Redirect to home if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push("/");
    } else if (user) {
      // Always grant access during development
      setAccessVerified(true);
      setShowAccessCodeModal(false);
      addLog("[Auth] Developer access granted automatically");
      
      // Check if the user is already verified - commented out for troubleshooting
      /*
      const isVerified = localStorage.getItem('developerAccessVerified') === 'true';
      if (isVerified) {
        setAccessVerified(true);
      } else {
        setShowAccessCodeModal(true);
      }
      */
      
      addLog("[Auth] User authenticated: " + (user?.email || "Unknown"));
    }
  }, [user, loading, router]);

  // Load users when verified
  useEffect(() => {
    if (user && accessVerified) {
      loadUsers();
    }
  }, [user, accessVerified]);

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen theme-bg-primary">
        <div className={`animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 ${darkMode ? 'border-cyan-500' : 'border-cyan-500'}`}></div>
      </div>
    );
  }

  // If user is not authenticated and not loading, this will render briefly before redirect
  if (!user) {
    return null;
  }

  // If access is not verified, show access code modal
  if (!accessVerified && showAccessCodeModal) {
    return (
      <div className="flex items-center justify-center min-h-screen theme-bg-primary">
        <div className="theme-bg-tertiary p-8 rounded-xl shadow-2xl max-w-md w-full border theme-border-primary">
          <div className="flex items-center justify-center mb-6">
            <Code className={`h-10 w-10 ${darkMode ? 'text-cyan-500' : 'text-cyan-500'} mr-3`} />
            <h1 className="text-2xl font-bold theme-text-primary">Developer Console</h1>
          </div>
          
          <p className="mb-6 text-center theme-text-secondary">
            Enter access code to continue
          </p>
          
          <div className="mb-6">
            <input
              id="access-code-input"
              type="password"
              className="w-full p-3 theme-bg-quaternary rounded-lg theme-border-primary border focus:outline-none focus:ring-2 focus:ring-amber-500 theme-text-primary text-center text-xl tracking-widest"
              placeholder="••••••••••••"
              value={accessCode}
              onChange={(e) => setAccessCode(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  verifyAccessCode();
                }
              }}
            />
          </div>
          
          <button
            onClick={verifyAccessCode}
            className={`w-full py-3 rounded-lg text-white font-medium ${
              darkMode ? 'bg-amber-500 hover:bg-amber-600' : 'bg-blue-500 hover:bg-blue-600'
            } transition-colors`}
          >
            Verify
          </button>
          
          <div className="mt-4 text-center">
            <button 
              onClick={() => router.push('/')} 
              className="theme-text-tertiary hover:theme-text-primary text-sm"
            >
              Return to Dashboard
            </button>
          </div>

          <style jsx global>{`
            .shake-animation {
              animation: shake 0.5s cubic-bezier(.36,.07,.19,.97) both;
            }
            
            @keyframes shake {
              10%, 90% {
                transform: translate3d(-1px, 0, 0);
              }
              20%, 80% {
                transform: translate3d(2px, 0, 0);
              }
              30%, 50%, 70% {
                transform: translate3d(-3px, 0, 0);
              }
              40%, 60% {
                transform: translate3d(3px, 0, 0);
              }
            }
          `}</style>
        </div>
      </div>
    );
  }

  // Filtered users based on search
  const filteredUsers = users.filter(user => 
    user.displayName?.toLowerCase().includes(userSearch.toLowerCase()) ||
    user.email?.toLowerCase().includes(userSearch.toLowerCase())
  );

  return (
    <div className="flex h-screen theme-bg-primary">
      {/* Sidebar */}
      <Sidebar 
        darkMode={darkMode}
        signOut={signOut}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
      />

      {/* Main content */}
      <div className="flex-1 overflow-auto theme-bg-secondary flex flex-col">
        {/* Header */}
        <header className="standard-header">
          <div className="standard-header-content">
            <div className="flex items-center mb-4">
                          <button 
              onClick={() => setSidebarOpen(!sidebarOpen)} 
              className="text-cyan-500 hover:text-cyan-600 transition-colors p-1"
            >
                {sidebarOpen ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                )}
              </button>

              {/* Messages button */}
              <div className="ml-2">
                <MessagesButton />
              </div>

              {/* Centered logo when sidebar is closed */}
              {!sidebarOpen && (
                <div className="header-logo-center">
                  <AmbientLogo theme={darkMode ? 'dark' : 'light'} size="xl" />
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Developer Console Content */}
        <div className="p-6 flex-grow flex flex-col overflow-hidden">
          {/* Users Management Content */}
          <div className="theme-bg-tertiary rounded-lg border theme-border-primary p-6 flex-grow overflow-hidden flex flex-col">
            <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="relative max-w-md">
                <input
                  type="text"
                  placeholder="Search users..."
                  className="pl-10 pr-4 py-2 w-full rounded theme-border-primary border theme-bg-quaternary theme-text-primary focus:outline-none focus:border-amber-500"
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                />
                <div className="absolute left-3 top-2.5 text-gray-400">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>
              
              <div className="flex space-x-2">
                <button
                  onClick={() => loadUsers()}
                  className={`flex items-center px-3 py-2 rounded ${darkMode ? 'bg-gray-700 text-gray-200 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh Users
                </button>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full rounded overflow-hidden">
                <thead>
                  <tr className="text-left theme-bg-quaternary">
                    <th className="px-6 py-3 text-xs font-medium theme-text-secondary uppercase tracking-wider">Name</th>
                    <th className="px-6 py-3 text-xs font-medium theme-text-secondary uppercase tracking-wider">Email</th>
                    <th className="px-6 py-3 text-xs font-medium theme-text-secondary uppercase tracking-wider">Role</th>
                    <th className="px-6 py-3 text-xs font-medium theme-text-secondary uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-xs font-medium theme-text-secondary uppercase tracking-wider">Created</th>
                    <th className="px-6 py-3 text-xs font-medium theme-text-secondary uppercase tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="theme-bg-tertiary divide-y divide-gray-200 theme-border-primary">
                  {filteredUsers.length > 0 ? filteredUsers.map(userData => (
                    <tr key={userData.id} className="hover:theme-bg-quaternary">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm theme-text-primary">{userData.displayName}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm theme-text-secondary">{userData.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          userData.role === 'admin' 
                            ? 'bg-purple-100 text-purple-800' 
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {userData.role === 'admin' ? 'Admin' : 'User'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          userData.active 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {userData.active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm theme-text-secondary">
                          {new Date(userData.createdAt).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex space-x-2 justify-end">
                          <button
                            onClick={() => resetUserData(userData.id)}
                            className={`p-1 rounded text-xs ${darkMode ? 'bg-gray-700 text-gray-200 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                            title="Reset User Data"
                          >
                            <RefreshCw className="h-4 w-4" />
                          </button>
                          
                          <button
                            onClick={() => handleDeleteUser(userData.id)}
                            className="p-1 rounded text-xs bg-red-500 text-white hover:bg-red-600"
                            title="Delete User"
                          >
                            <Trash className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={6} className="px-6 py-4 text-center theme-text-secondary">
                        {userSearch ? "No users match your search" : "No users found"}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
          
          {/* Console log panel */}
          <div className={`mt-6 theme-bg-tertiary rounded-lg border theme-border-primary overflow-hidden flex flex-col ${showLogsPanel ? 'h-64' : 'h-10'}`}>
            <div className="px-4 py-2 flex items-center justify-between border-b theme-border-primary">
              <div className="flex items-center">
                <Terminal className="h-4 w-4 mr-2 theme-text-secondary" />
                <h3 className="text-sm font-medium theme-text-secondary">System Logs</h3>
              </div>
              <div className="flex items-center space-x-2">
                <button 
                  onClick={clearLogs}
                  className="p-1 text-xs theme-text-secondary hover:theme-text-primary"
                >
                  Clear
                </button>
                <button 
                  onClick={() => setShowLogsPanel(!showLogsPanel)}
                  className="p-1 text-xs theme-text-secondary hover:theme-text-primary"
                >
                  {showLogsPanel ? <EyeOff className="h-4 w-4" /> : <Terminal className="h-4 w-4" />}
                </button>
              </div>
            </div>
            
            {showLogsPanel && (
              <div className="p-3 font-mono text-xs theme-text-secondary overflow-y-auto flex-grow">
                {logs.map((log, index) => (
                  <div key={index} className="mb-1">
                    <span className="opacity-60">{new Date().toLocaleTimeString()}</span> {log}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add User Modal */}
      {showAddUserModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 backdrop-blur-sm">
          <div className="theme-bg-tertiary rounded-lg shadow-xl max-w-md w-full mx-4 theme-border-primary border">
            <div className="p-4 border-b theme-border-primary flex items-center justify-between">
              <h3 className="text-lg font-semibold theme-text-primary">
                Invite New User
              </h3>
              <button
                onClick={() => setShowAddUserModal(false)}
                className="theme-text-secondary hover:theme-text-primary"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <form onSubmit={handleAddUser} className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium theme-text-secondary mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    required
                    className="w-full p-2 theme-bg-quaternary rounded theme-border-primary border focus:outline-none focus:ring-2 focus:ring-amber-500 theme-text-primary"
                    value={newUserData.email}
                    onChange={(e) => setNewUserData({...newUserData, email: e.target.value})}
                    placeholder="Enter email address"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium theme-text-secondary mb-1">
                    Display Name
                  </label>
                  <input
                    type="text"
                    required
                    className="w-full p-2 theme-bg-quaternary rounded theme-border-primary border focus:outline-none focus:ring-2 focus:ring-amber-500 theme-text-primary"
                    value={newUserData.displayName}
                    onChange={(e) => setNewUserData({...newUserData, displayName: e.target.value})}
                    placeholder="Enter user's name"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium theme-text-secondary mb-1">
                    Role
                  </label>
                  <select
                    className="w-full p-2 theme-bg-quaternary rounded theme-border-primary border focus:outline-none focus:ring-2 focus:ring-amber-500 theme-text-primary"
                    value={newUserData.role}
                    onChange={(e) => setNewUserData({...newUserData, role: e.target.value as 'admin' | 'user'})}
                  >
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                  </select>
                  <p className="mt-1 text-xs theme-text-secondary">Admin users will have full access to the developer console</p>
                </div>
              </div>
              
              <div className="mt-6">
                <p className="text-sm theme-text-secondary mb-4">
                  An invitation link will be generated for you to share with the user.
                </p>
              </div>
              
              <div className="mt-4 flex justify-end">
                <button
                  type="button"
                  onClick={() => setShowAddUserModal(false)}
                  className="px-4 py-2 theme-text-primary theme-bg-quaternary rounded mr-2 hover:opacity-80"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`px-4 py-2 text-white rounded flex items-center ${darkMode ? 'bg-amber-500 hover:bg-amber-600' : 'bg-blue-500 hover:bg-blue-600'}`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  Generate Invitation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Invitation Success Modal */}
      {showInvitationSuccess && invitationLink && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 backdrop-blur-sm">
          <div className="theme-bg-tertiary rounded-lg shadow-xl max-w-md w-full mx-4 theme-border-primary border">
            <div className="p-4 border-b theme-border-primary flex items-center justify-between">
              <h3 className="text-lg font-semibold theme-text-primary flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Invitation Created
              </h3>
              <button
                onClick={() => setShowInvitationSuccess(false)}
                className="theme-text-secondary hover:theme-text-primary"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-6">
              <div className="mb-6">
                <p className="theme-text-secondary mb-4">
                  The invitation has been created successfully. Share this link with the user to complete their registration:
                </p>
                
                <div className="theme-bg-quaternary rounded-lg p-3 font-mono text-sm theme-text-primary break-all border theme-border-primary">
                  {window.location.origin}{invitationLink}
                </div>
                
                <div className="mt-4">
                  <button
                    onClick={copyInvitationLink}
                    className={`flex items-center justify-center w-full py-2 rounded-lg theme-bg-primary hover:opacity-90 transition text-sm ${copySuccess ? 'text-green-500' : 'theme-text-primary'}`}
                  >
                    {copySuccess ? (
                      <>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Copied to Clipboard
                      </>
                    ) : (
                      <>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                        </svg>
                        Copy Invitation Link
                      </>
                    )}
                  </button>
                </div>
              </div>
              
              <div className="border-t theme-border-primary pt-4">
                <div className="mb-4">
                  <p className="theme-text-secondary text-sm">
                    <strong>User:</strong> {newUserData.email}
                  </p>
                  <p className="theme-text-secondary text-sm">
                    <strong>Role:</strong> {newUserData.role === 'admin' ? 'Admin' : 'User'}
                  </p>
                  <p className="theme-text-secondary text-sm">
                    <strong>Valid for:</strong> 7 days
                  </p>
                </div>
                
                <div className="flex justify-end">
                  <button
                    onClick={() => {
                      setShowInvitationSuccess(false);
                      loadUsers(); // Refresh user list
                    }}
                    className={`px-4 py-2 text-white rounded ${darkMode ? 'bg-amber-500 hover:bg-amber-600' : 'bg-blue-500 hover:bg-blue-600'}`}
                  >
                    Done
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Edit User Modal */}
      {showEditUserModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 backdrop-blur-sm">
          <div className="theme-bg-tertiary rounded-lg shadow-xl max-w-md w-full mx-4 theme-border-primary border">
            <div className="p-4 border-b theme-border-primary flex items-center justify-between">
              <h3 className="text-lg font-semibold theme-text-primary">
                Edit User
              </h3>
              <button
                onClick={() => setShowEditUserModal(false)}
                className="theme-text-secondary hover:theme-text-primary"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <form onSubmit={handleEditUser} className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium theme-text-secondary mb-1">
                    Role
                  </label>
                  <select
                    className="w-full p-2 theme-bg-quaternary rounded theme-border-primary border focus:outline-none focus:ring-2 focus:ring-amber-500 theme-text-primary"
                    value={editUserData.role}
                    onChange={(e) => setEditUserData({...editUserData, role: e.target.value as 'admin' | 'user'})}
                  >
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium theme-text-secondary mb-1">
                    Pay Type
                  </label>
                  <select
                    className="w-full p-2 theme-bg-quaternary rounded theme-border-primary border focus:outline-none focus:ring-2 focus:ring-amber-500 theme-text-primary"
                    value={editUserData.payType}
                    onChange={(e) => setEditUserData({...editUserData, payType: e.target.value})}
                  >
                    <option value="Intern Rep">Intern Rep</option>
                    <option value="Veteran Rep">Veteran Rep</option>
                    <option value="Pro Rep">Pro Rep</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium theme-text-secondary mb-1">
                    User Role
                  </label>
                  <select
                    className="w-full p-2 theme-bg-quaternary rounded theme-border-primary border focus:outline-none focus:ring-2 focus:ring-amber-500 theme-text-primary"
                    value={editUserData.userRole}
                    onChange={(e) => setEditUserData({...editUserData, userRole: e.target.value})}
                  >
                    <option value="Setter">Setter</option>
                    <option value="Closer">Closer</option>
                    <option value="Self Gen">Self Gen</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium theme-text-secondary mb-1">
                    Manager
                  </label>
                  <input
                    type="text"
                    className="w-full p-2 theme-bg-quaternary rounded theme-border-primary border focus:outline-none focus:ring-2 focus:ring-amber-500 theme-text-primary"
                    value={editUserData.managerName}
                    onChange={(e) => setEditUserData({...editUserData, managerName: e.target.value})}
                    placeholder="Enter manager's name"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium theme-text-secondary mb-1">
                    Status
                  </label>
                  <select
                    className="w-full p-2 theme-bg-quaternary rounded theme-border-primary border focus:outline-none focus:ring-2 focus:ring-amber-500 theme-text-primary"
                    value={editUserData.active ? "active" : "inactive"}
                    onChange={(e) => setEditUserData({...editUserData, active: e.target.value === "active"})}
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>
              
              <div className="mt-6 flex justify-end">
                <button
                  type="button"
                  onClick={() => setShowEditUserModal(false)}
                  className="px-4 py-2 theme-text-primary theme-bg-quaternary rounded mr-2 hover:opacity-80"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`px-4 py-2 text-white rounded ${darkMode ? 'bg-amber-500 hover:bg-amber-600' : 'bg-blue-500 hover:bg-blue-600'}`}
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
} 
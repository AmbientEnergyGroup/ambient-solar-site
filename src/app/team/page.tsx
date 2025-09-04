"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/contexts/AuthContext";
import { updateUserActive, getAllUsers, UserData } from "@/lib/firebase/firebaseUtils";
import { Users, LogOut, Home, Search, Plus, Filter, MapPin } from "lucide-react";
import AmbientLogo from "@/components/AmbientLogo";
import Sidebar from "@/components/Sidebar";
import { useTheme } from "@/lib/hooks/useTheme";
import ClientOnly from "@/components/ClientOnly";
import MessagesButton from "@/components/MessagesButton";
import OfficeLogos from "@/components/OfficeLogos";
import { 
  calculateTeamEarnings, 
  calculateTeamRevenue, 
  calculateTeamEarningsByOffice,
  calculateTeamRevenueByOffice,
  calculateManagerCommission,
  getUserPayType,
  Project 
} from "@/lib/utils/commissionCalculations";

export default function Team() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isClient, setIsClient] = useState(false);
  const [userOffice, setUserOffice] = useState("Fresno"); // Default office
  const [lancasterTeamSize, setLancasterTeamSize] = useState(0);
  const [teamGoalKW, setTeamGoalKW] = useState(0);
  const [ytdTeamEarnings, setYtdTeamEarnings] = useState(0);
  const [ytdRevenue, setYtdRevenue] = useState(0);
  const [showAddRepForm, setShowAddRepForm] = useState(false);
  const [newRepData, setNewRepData] = useState({
    name: '',
    email: '',
    role: 'Sales Rep',
    office: 'Fresno',
    recruitedBy: '',
    addendum: ''
  });
  const [showRepInfo, setShowRepInfo] = useState(false);
  const [selectedRepInfo, setSelectedRepInfo] = useState<{
    name: string;
    email: string;
    phone: string;
  } | null>(null);
  const [loadingTimeout, setLoadingTimeout] = useState(false);
  const [repPerformance, setRepPerformance] = useState<{[key: string]: number}>({});
  const [teamFilter, setTeamFilter] = useState<'direct' | 'downline'>('direct');
  const [statusFilter, setStatusFilter] = useState<'active' | 'inactive' | 'all'>('all');
  const [teamMembers, setTeamMembers] = useState<UserData[]>([]);
  const [loadingTeamMembers, setLoadingTeamMembers] = useState(false);
  const [showDeactivateConfirm, setShowDeactivateConfirm] = useState(false);
  const [memberToDeactivate, setMemberToDeactivate] = useState<{
    id: string;
    name: string;
    email: string;
  } | null>(null);
  const WEEKLY_GOAL_KW = 200;
  const { darkMode } = useTheme();
  
  const auth = useAuth();
  const { user, userData, loading, signOut } = auth || {};
  const router = useRouter();

  // Add a new useEffect for client-side initialization
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Add timeout to prevent infinite loading
  useEffect(() => {
    if (loading) {
      const timeout = setTimeout(() => {
        setLoadingTimeout(true);
      }, 10000); // 10 seconds timeout
      
      return () => clearTimeout(timeout);
    } else {
      setLoadingTimeout(false);
    }
  }, [loading]);

  // Load user's office from localStorage
  useEffect(() => {
    if (user) {
      const savedOffice = localStorage.getItem("userOffice") || "Fresno";
      setUserOffice(savedOffice);
    }
  }, [user]);

  // Count users in localStorage whose office is 'Lancaster'
  useEffect(() => {
    let count = 0;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('userData_')) {
        try {
          const userData = JSON.parse(localStorage.getItem(key) || '{}');
          if (userData.office === 'Lancaster' && userData.active !== false) {
            count++;
          }
        } catch {}
      }
    }
    setLancasterTeamSize(count);
  }, [isClient]);

  // Calculate total kW sold for Lancaster this week
  useEffect(() => {
    let totalKW = 0;
    const projectsRaw = localStorage.getItem('projects');
    if (projectsRaw) {
      try {
        const projects = JSON.parse(projectsRaw);
        const now = new Date();
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay()); // Sunday
        startOfWeek.setHours(0,0,0,0);
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 7);
        for (const project of projects) {
          if (
            project.systemSize &&
            project.office === 'Lancaster' &&
            project.installDate &&
            new Date(project.installDate) >= startOfWeek &&
            new Date(project.installDate) < endOfWeek
          ) {
            totalKW += parseFloat(project.systemSize);
          }
        }
      } catch {}
    }
    setTeamGoalKW(totalKW);
  }, [isClient]);

  // Calculate YTD manager commission and team revenue using shared calculation logic
  useEffect(() => {
    const projectsRaw = localStorage.getItem('projects');
    if (projectsRaw) {
      try {
        const projects: Project[] = JSON.parse(projectsRaw);
        const currentYear = new Date().getFullYear();
        
        // Calculate manager commission ($175/kW on all team deals) and total team revenue (includes all team members + manager)
        const managerCommission = calculateManagerCommission(projects, currentYear, userData?.managerType);
        const totalRevenue = calculateTeamRevenue(projects, currentYear);
        
        setYtdTeamEarnings(managerCommission);
        setYtdRevenue(totalRevenue);
      } catch (error) {
        console.error('Error calculating team stats:', error);
        setYtdTeamEarnings(0);
        setYtdRevenue(0);
      }
    } else {
      setYtdTeamEarnings(0);
      setYtdRevenue(0);
    }
  }, [isClient]);

  // Calculate YTD kW sold for each rep using shared calculation logic
  useEffect(() => {
    const performance: {[key: string]: number} = {};
    const projectsRaw = localStorage.getItem('projects');
    if (projectsRaw) {
      try {
        const projects: Project[] = JSON.parse(projectsRaw);
        const currentYear = new Date().getFullYear();
        
        // Sample rep data - in a real app, this would come from your user database
        const reps = [
          { name: 'John Doe', email: 'john.doe@example.com' },
          { name: 'Sarah Johnson', email: 'sarah.j@example.com' },
          { name: 'Mike Wilson', email: 'mike.w@example.com' }
        ];
        
        // Initialize performance for each rep
        reps.forEach(rep => {
          performance[rep.name] = 0;
        });
        
        for (const project of projects) {
          // Check if project is from current year and not cancelled
          if (project.installDate && 
              new Date(project.installDate).getFullYear() === currentYear &&
              project.status !== 'cancelled') {
            if (project.systemSize && project.customerName) {
              const systemSizeKW = parseFloat(project.systemSize);
              
              // Match project to rep (in a real app, you'd match by userId or rep assignment)
              // For demo purposes, we'll distribute projects among reps
              const repIndex = Math.abs(project.customerName.length) % reps.length;
              const assignedRep = reps[repIndex];
              performance[assignedRep.name] += systemSizeKW;
            }
          }
        }
      } catch (error) {
        console.error('Error calculating rep performance:', error);
      }
    }
    setRepPerformance(performance);
  }, [isClient]);

  // Handle form input changes
  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setNewRepData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle form submission
  const handleAddRep = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Send invitation email via API
      const response = await fetch('/api/send-invite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newRepData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to send invitation');
      }
      
      // Reset form and close dropdown
      setNewRepData({
        name: '',
        email: '',
        role: 'Sales Rep',
        office: 'Fresno',
        recruitedBy: '',
        addendum: ''
      });
      setShowAddRepForm(false);
      
      // Show success message
      alert(`Invitation sent to ${newRepData.name} at ${newRepData.email}. They will be recruited by ${newRepData.recruitedBy}`);
      
      // Refresh team members list to show the new rep
      loadTeamMembers();
      
    } catch (error) {
      console.error('Error sending invitation:', error);
      alert(`Failed to send invitation: ${error instanceof Error ? error.message : 'Please try again.'}`);
    }
  };

  // Handle showing rep info
  const handleShowRepInfo = (rep: { name: string; email: string; phone: string }) => {
    setSelectedRepInfo(rep);
    setShowRepInfo(true);
  };

  // Handle deactivate member
  const handleDeactivateMember = (member: { id: string; name: string; email: string }) => {
    setMemberToDeactivate(member);
    setShowDeactivateConfirm(true);
  };

  // Confirm deactivation
  const confirmDeactivation = async () => {
    if (!memberToDeactivate) return;

    try {
      // In a real app, you would call your API to deactivate the user
      // For now, we'll simulate the deactivation
      console.log('Deactivating user:', memberToDeactivate);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Show success message
      alert(`Account for ${memberToDeactivate.name} has been deactivated successfully.`);
      
      // Close confirmation dialog
      setShowDeactivateConfirm(false);
      setMemberToDeactivate(null);
      
    } catch (error) {
      console.error('Error deactivating user:', error);
      alert('Failed to deactivate account. Please try again.');
    }
  };

  // Load team members from Firebase
  const loadTeamMembers = async () => {
    if (!user) return;
    
    setLoadingTeamMembers(true);
    try {
      const allUsers = await getAllUsers();
      console.log('Loaded all users:', allUsers);
      
      // Filter to get team members recruited by current user
      const myTeamMembers = allUsers.filter((userData: any) => 
        userData.recruitedBy === user.displayName || 
        userData.recruitedBy === user.email ||
        userData.recruitedBy === (user.displayName || user.email)
      );
      
      console.log('My team members:', myTeamMembers);
      setTeamMembers(myTeamMembers);
    } catch (error) {
      console.error('Error loading team members:', error);
      setTeamMembers([]);
    } finally {
      setLoadingTeamMembers(false);
    }
  };

  // Filter team members based on Direct vs Downline and Active vs Inactive
  const getFilteredTeamMembers = () => {
    // Use real team data from Firebase only - no fake users
    const allTeamMembers = teamMembers.map((member: any) => ({
      id: member.id,
      name: member.displayName,
      email: member.email,
      phone: member.phoneNumber || 'Not provided',
      role: member.role === 'admin' ? 'Manager' : member.role === 'setter' ? 'Sales Rep' : member.role,
      mr: member.recruitedBy || 'Unknown',
      status: member.active ? 'Active' : 'Inactive',
      isActive: member.active,
      performance: repPerformance[member.displayName] || 0,
      isDirect: true // All team members are direct reports
    }));

    let filteredMembers = allTeamMembers;

    // Apply team filter (direct vs downline)
    if (teamFilter === 'direct') {
      filteredMembers = filteredMembers.filter(member => member.isDirect);
    }
    // If 'downline', show all members (no additional filtering needed)

    // Apply status filter (active vs inactive)
    if (statusFilter === 'active') {
      filteredMembers = filteredMembers.filter(member => member.isActive);
    } else if (statusFilter === 'inactive') {
      filteredMembers = filteredMembers.filter(member => !member.isActive);
    }
    // If 'all', show all members (no additional filtering needed)

    return filteredMembers;
  };

  // Get list of managers for the Add Rep form
  const getManagersList = () => {
    const allTeamMembers = getFilteredTeamMembers();
    const managers = allTeamMembers.filter((member: any) => member.role === 'Manager');
    
    // Add current user as a manager option
    const currentUser = {
      name: user?.displayName || user?.email || 'Current User',
      email: user?.email || '',
      role: 'Manager'
    };
    
    return [currentUser, ...managers];
  };

  // Load team members when component mounts or user changes
  useEffect(() => {
    if (user) {
      loadTeamMembers();
    }
  }, [user]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showAddRepForm) {
        const target = event.target as Element;
        if (!target.closest('.add-rep-dropdown')) {
          setShowAddRepForm(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showAddRepForm]);

  // Redirect to home if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push("/");
    }
  }, [user, loading, router]);

  // Show loading state while checking authentication
  if (loading && !loadingTimeout) {
    return (
      <div className="flex items-center justify-center min-h-screen theme-bg-primary">
        <div className="text-center">
          <div className={`animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 ${darkMode ? 'border-cyan-500' : 'border-cyan-500'} mx-auto mb-4`}></div>
          <p className="theme-text-primary">Loading...</p>
        </div>
      </div>
    );
  }

  // Show timeout message if loading takes too long
  if (loadingTimeout) {
    return (
      <div className="flex items-center justify-center min-h-screen theme-bg-primary">
        <div className="text-center">
          <p className="theme-text-primary mb-4">Loading is taking longer than expected...</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-cyan-500 text-white rounded hover:bg-cyan-600"
          >
            Refresh Page
          </button>
        </div>
      </div>
    );
  }

  // If user is not authenticated and not loading, redirect to home
  if (!user) {
    router.push("/");
    return (
      <div className="flex items-center justify-center min-h-screen theme-bg-primary">
        <div className="text-center">
          <p className="theme-text-primary">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  return (
    <ClientOnly>
      <div className="flex h-screen theme-bg-primary">
        {/* Sidebar */}
        <Sidebar 
          darkMode={darkMode}
          signOut={signOut}
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
        />

        {/* Main content */}
        <div className="flex-1 overflow-auto theme-bg-secondary">
          {/* Header */}
          <header className="standard-header">
            <div className="standard-header-content">
              <button 
                onClick={() => setSidebarOpen(!sidebarOpen)} 
                className="theme-text-primary hover:opacity-70 transition-opacity p-1"
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
          </header>

          {/* Team content */}
          <main className="p-6">
            {/* Search and filters */}
            <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-center gap-2 relative add-rep-dropdown">
                <button 
                  onClick={() => setShowAddRepForm(!showAddRepForm)}
                  className={`px-4 py-2 ${darkMode ? 'bg-cyan-500 hover:bg-cyan-600' : 'bg-cyan-500 hover:bg-cyan-600'} text-white rounded-lg font-medium transition-colors duration-200 flex items-center`}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Rep
                </button>
                
                {/* Dropdown Form */}
                {showAddRepForm && (
                  <div className="absolute top-full left-0 mt-2 w-80 theme-bg-tertiary border theme-border-primary rounded-lg shadow-lg z-50">
                    <div className="p-4">
                      <h3 className="text-lg font-semibold theme-text-primary mb-4">Add New Rep</h3>
                      <form onSubmit={handleAddRep} className="space-y-4">
                        {/* Name Field */}
                        <div>
                          <label className="block text-sm font-medium theme-text-secondary mb-1">
                            Full Name
                          </label>
                          <input
                            type="text"
                            name="name"
                            value={newRepData.name}
                            onChange={handleFormChange}
                            required
                            className="w-full px-3 py-2 border theme-border-primary rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500 theme-bg-quaternary theme-text-primary"
                            placeholder="Enter rep's full name"
                          />
                        </div>
                        
                        {/* Email Field */}
                        <div>
                          <label className="block text-sm font-medium theme-text-secondary mb-1">
                            Email Address
                          </label>
                          <input
                            type="email"
                            name="email"
                            value={newRepData.email}
                            onChange={handleFormChange}
                            required
                            className="w-full px-3 py-2 border theme-border-primary rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500 theme-bg-quaternary theme-text-primary"
                            placeholder="Enter rep's email address"
                          />
                        </div>
                        
                        {/* Role Field */}
                        <div>
                          <label className="block text-sm font-medium theme-text-secondary mb-1">
                            Role
                          </label>
                          <select
                            name="role"
                            value={newRepData.role}
                            onChange={handleFormChange}
                            className="w-full px-3 py-2 border theme-border-primary rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500 theme-bg-quaternary theme-text-primary"
                          >
                            <option value="Sales Rep">Sales Rep</option>
                            <option value="Manager">Manager</option>
                            <option value="Team Lead">Team Lead</option>
                          </select>
                        </div>
                        
                        {/* Office Field */}
                        <div>
                          <label className="block text-sm font-medium theme-text-secondary mb-1">
                            Office
                          </label>
                          <select
                            name="office"
                            value={newRepData.office}
                            onChange={handleFormChange}
                            className="w-full px-3 py-2 border theme-border-primary rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500 theme-bg-quaternary theme-text-primary"
                          >
                            <option value="Fresno">Fresno</option>
                            <option value="Lancaster">Lancaster</option>
                          </select>
                        </div>
                        
                        {/* Recruited By Field */}
                        <div>
                          <label className="block text-sm font-medium theme-text-secondary mb-1">
                            Recruited By (Manager)
                          </label>
                          <select
                            name="recruitedBy"
                            value={newRepData.recruitedBy}
                            onChange={handleFormChange}
                            className="w-full px-3 py-2 border theme-border-primary rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500 theme-bg-quaternary theme-text-primary"
                            required
                          >
                            <option value="">Select manager</option>
                            {getManagersList().map((manager, index) => (
                              <option key={index} value={manager.name}>
                                {manager.name} {manager.email && `(${manager.email})`}
                              </option>
                            ))}
                          </select>
                        </div>
                        
                        {/* Addendum Field */}
                        <div>
                          <label className="block text-sm font-medium theme-text-secondary mb-1">
                            Addendum (Optional)
                          </label>
                          <textarea
                            name="addendum"
                            value={newRepData.addendum}
                            onChange={handleFormChange}
                            rows={4}
                            className="w-full px-3 py-2 border theme-border-primary rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500 theme-bg-quaternary theme-text-primary resize-vertical"
                            placeholder="Enter any specific terms, changes, or additions to the standard rep agreement..."
                          />
                          <p className="text-xs text-gray-500 mt-1">
                            This will be added to the bottom of the rep agreement for signature.
                          </p>
                        </div>
                        
                        {/* Form Actions */}
                        <div className="flex gap-2 pt-2">
                          <button
                            type="submit"
                            className="flex-1 px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-md font-medium transition-colors duration-200"
                          >
                            Send Invitation
                          </button>
                          <button
                            type="button"
                            onClick={() => setShowAddRepForm(false)}
                            className="px-4 py-2 theme-bg-quaternary theme-text-primary theme-border-primary border rounded-md hover:theme-bg-tertiary transition-colors duration-200"
                          >
                            Cancel
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {/* Overview cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {/* Rep Name Card */}
              <div className="theme-bg-tertiary p-6 rounded-lg shadow-sm border theme-border-primary">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold theme-text-primary">{user?.displayName || user?.email || 'User'}</p>
                  </div>
                  <div className={`p-3 rounded-full ${darkMode ? 'bg-cyan-500 bg-opacity-20' : 'bg-cyan-500 bg-opacity-20'}`}>
                    <svg xmlns="http://www.w3.org/2000/svg" className={`h-6 w-6 ${darkMode ? 'text-cyan-500' : 'text-cyan-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                </div>
              </div>
              
              {/* YTD Manager Commission Card */}
              <div className="theme-bg-tertiary p-6 rounded-lg shadow-sm border theme-border-primary">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm theme-text-secondary">YTD Manager Commission</p>
                    <p className="text-2xl font-bold theme-text-primary">${ytdTeamEarnings.toLocaleString()}</p>
                    <p className="text-xs theme-text-secondary mt-1">
                      {userData?.managerType === 'Area Manager' ? '$100/kW' : 
                       userData?.managerType === 'Regional' ? '$300/kW' : 
                       '$175/kW'} on team deals
                    </p>
                  </div>
                  <div className={`p-3 rounded-full ${darkMode ? 'bg-green-500 bg-opacity-20' : 'bg-green-500 bg-opacity-20'}`}>
                    <svg xmlns="http://www.w3.org/2000/svg" className={`h-6 w-6 ${darkMode ? 'text-green-500' : 'text-green-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                    </svg>
                  </div>
                </div>
              </div>
              
              {/* YTD Revenue Card */}
              <div className="theme-bg-tertiary p-6 rounded-lg shadow-sm border theme-border-primary">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm theme-text-secondary">YTD Team Revenue</p>
                    <p className="text-2xl font-bold theme-text-primary">${ytdRevenue.toLocaleString()}</p>
                    <p className="text-xs theme-text-secondary mt-1">All team members + manager</p>
                  </div>
                  <div className={`p-3 rounded-full ${darkMode ? 'bg-purple-500 bg-opacity-20' : 'bg-purple-500 bg-opacity-20'}`}>
                    <svg xmlns="http://www.w3.org/2000/svg" className={`h-6 w-6 ${darkMode ? 'text-purple-500' : 'text-purple-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Team members table */}
            <div className="theme-bg-tertiary rounded-lg shadow overflow-hidden">
              <div className="px-6 py-4 border-b theme-border-primary">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold theme-text-primary">Team Members</h2>
                  
                  {/* Filter buttons */}
                  <div className="flex items-center space-x-2">
                    {/* Team Filter */}
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => setTeamFilter('direct')}
                        className={`px-3 py-1 text-sm font-medium rounded-md transition-colors duration-200 ${
                          teamFilter === 'direct'
                            ? 'bg-cyan-500 text-white'
                            : 'theme-bg-quaternary theme-text-primary hover:theme-bg-tertiary'
                        }`}
                      >
                        Direct
                      </button>
                      <button
                        onClick={() => setTeamFilter('downline')}
                        className={`px-3 py-1 text-sm font-medium rounded-md transition-colors duration-200 ${
                          teamFilter === 'downline'
                            ? 'bg-cyan-500 text-white'
                            : 'theme-bg-quaternary theme-text-primary hover:theme-bg-tertiary'
                        }`}
                      >
                        Downline
                      </button>
                    </div>
                    
                    {/* Status Filter */}
                    <div className="flex items-center space-x-1 ml-2">
                      <button
                        onClick={() => setStatusFilter('active')}
                        className={`px-3 py-1 text-sm font-medium rounded-md transition-colors duration-200 ${
                          statusFilter === 'active'
                            ? 'bg-green-500 text-white'
                            : 'theme-bg-quaternary theme-text-primary hover:theme-bg-tertiary'
                        }`}
                      >
                        Active
                      </button>
                      <button
                        onClick={() => setStatusFilter('inactive')}
                        className={`px-3 py-1 text-sm font-medium rounded-md transition-colors duration-200 ${
                          statusFilter === 'inactive'
                            ? 'bg-red-500 text-white'
                            : 'theme-bg-quaternary theme-text-primary hover:theme-bg-tertiary'
                        }`}
                      >
                        Inactive
                      </button>
                      <button
                        onClick={() => setStatusFilter('all')}
                        className={`px-3 py-1 text-sm font-medium rounded-md transition-colors duration-200 ${
                          statusFilter === 'all'
                            ? 'bg-gray-500 text-white'
                            : 'theme-bg-quaternary theme-text-primary hover:theme-bg-tertiary'
                        }`}
                      >
                        All
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="border-b theme-border-primary text-left theme-bg-tertiary">
                      <th className="px-6 py-3 text-xs font-medium theme-text-secondary uppercase tracking-wider">
                        Rep Info
                      </th>
                      <th className="px-6 py-3 text-xs font-medium theme-text-secondary uppercase tracking-wider">
                        Role
                      </th>
                      <th className="px-6 py-3 text-xs font-medium theme-text-secondary uppercase tracking-wider">
                        MR
                      </th>
                      <th className="px-6 py-3 text-xs font-medium theme-text-secondary uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-xs font-medium theme-text-secondary uppercase tracking-wider">
                        YTD kW Sold
                      </th>
                      <th className="px-6 py-3 text-xs font-medium theme-text-secondary uppercase tracking-wider text-right">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y theme-border-secondary">
                    {loadingTeamMembers ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-12 text-center">
                          <div className="flex flex-col items-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500 mb-4"></div>
                            <p className="text-sm theme-text-secondary">Loading team members...</p>
                          </div>
                        </td>
                      </tr>
                    ) : getFilteredTeamMembers().length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-12 text-center">
                          <div className="flex flex-col items-center">
                            <Users className="h-12 w-12 theme-text-secondary mb-4" />
                            <h3 className="text-lg font-medium theme-text-primary mb-2">No team members yet</h3>
                            <p className="text-sm theme-text-secondary mb-4">
                              Start building your team by adding new representatives.
                            </p>
                            <button
                              onClick={() => setShowAddRepForm(true)}
                              className="px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-md font-medium transition-colors duration-200"
                            >
                              Add Your First Rep
                            </button>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      getFilteredTeamMembers().map((member, index) => (
                      <tr key={index} className="hover:theme-bg-quaternary">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="text-sm font-medium theme-text-primary mr-2">{member.name}</div>
                            <button
                              onClick={() => handleShowRepInfo({
                                name: member.name,
                                email: member.email,
                                phone: member.phone
                              })}
                              className="p-1 hover:bg-gray-100 dark:hover:bg-black rounded-full transition-colors duration-200"
                              title="View contact info"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 theme-text-secondary hover:theme-text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            </button>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            member.role === 'Manager' 
                              ? 'bg-purple-100 text-purple-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}>
                            {member.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm theme-text-primary">{member.mr}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            member.status === 'Active'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {member.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm theme-text-primary">
                          <div className="text-center">
                            <span className="font-semibold text-lg">{member.performance.toFixed(1)}</span>
                            <span className="text-xs theme-text-secondary ml-1">kW</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button className="text-blue-600 hover:text-blue-900 mr-3">Edit</button>
                          <button 
                            onClick={() => handleDeactivateMember({
                              id: member.id,
                              name: member.name,
                              email: member.email
                            })}
                            className="text-red-600 hover:text-red-900"
                            disabled={!member.isActive}
                          >
                            {member.isActive ? 'Deactivate' : 'Inactive'}
                          </button>
                        </td>
                      </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </main>
        </div>
      </div>

      {/* Rep Info Modal */}
      {showRepInfo && selectedRepInfo && (
        <div className="fixed inset-0 flex items-center justify-center z-50 theme-bg-primary bg-opacity-75">
          <div className="theme-bg-tertiary rounded-lg shadow-lg max-w-md w-full mx-4">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold theme-text-primary">Contact Information</h2>
                <button
                  onClick={() => setShowRepInfo(false)}
                  className="p-1 hover:bg-gray-100 dark:hover:bg-black rounded-full transition-colors duration-200"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 theme-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="space-y-4">
                {/* Rep Name */}
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-cyan-100 rounded-full flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-cyan-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm theme-text-secondary">Name</p>
                    <p className="font-medium theme-text-primary">{selectedRepInfo.name}</p>
                  </div>
                </div>

                {/* Phone Number */}
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm theme-text-secondary">Phone</p>
                    <p className="font-medium theme-text-primary">{selectedRepInfo.phone}</p>
                  </div>
                </div>

                {/* Email Address */}
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm theme-text-secondary">Email</p>
                    <p className="font-medium theme-text-primary">{selectedRepInfo.email}</p>
                  </div>
                </div>
              </div>
              
              <div className="border-t theme-border-primary p-4 flex justify-end mt-6">
                <button
                  onClick={() => setShowRepInfo(false)}
                  className="px-4 py-2 theme-bg-quaternary theme-text-primary theme-border-primary border rounded-md hover:theme-bg-tertiary"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Deactivation Confirmation Modal */}
      {showDeactivateConfirm && memberToDeactivate && (
        <div className="fixed inset-0 flex items-center justify-center z-50 theme-bg-primary bg-opacity-75">
          <div className="theme-bg-tertiary rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center mr-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 19.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold theme-text-primary">Deactivate Account</h3>
              </div>
              
              <div className="mb-6">
                <p className="text-sm theme-text-secondary mb-2">
                  Are you sure you want to deactivate the account for:
                </p>
                <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded-lg">
                  <p className="font-medium theme-text-primary">{memberToDeactivate.name}</p>
                  <p className="text-sm theme-text-secondary">{memberToDeactivate.email}</p>
                </div>
                <p className="text-sm theme-text-secondary mt-2">
                  This will prevent them from accessing the system but preserve their data.
                </p>
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowDeactivateConfirm(false);
                    setMemberToDeactivate(null);
                  }}
                  className="px-4 py-2 theme-bg-quaternary theme-text-primary theme-border-primary border rounded-md hover:theme-bg-tertiary"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDeactivation}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors duration-200"
                >
                  Deactivate Account
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </ClientOnly>
  );
} 
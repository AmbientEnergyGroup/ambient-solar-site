'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useTheme } from '@/lib/hooks/useTheme';
import { Users, Search, Mail, Phone, MapPin, DollarSign, Crown, Building } from 'lucide-react';
import AmbientLogo from '@/components/AmbientLogo';
import MessagesButton from '@/components/MessagesButton';
import Sidebar from '@/components/Sidebar';
import { getAllUsers, UserData } from '@/lib/firebase/firebaseUtils';

export default function RepTreePage() {
  const auth = useAuth();
  const { user, userData, loading, signOut } = auth || {};
  const { darkMode, toggleTheme } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [allUsers, setAllUsers] = useState<UserData[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserData[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState<string>("all");
  const [filterOffice, setFilterOffice] = useState<string>("all");

  // Load users immediately
  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      // Try Firebase first
      const users = await getAllUsers();
      if (users && users.length > 0) {
        const activeUsers = users.filter(user => user.active !== false);
        setAllUsers(activeUsers);
        setFilteredUsers(activeUsers);
        return;
      }
    } catch (error) {
      console.log('Firebase not available, using mock data');
    }
    
    // Fallback to mock data - always works
    const mockUsers: UserData[] = [
      {
        id: '1',
        uid: '1',
        displayName: 'John Smith',
        email: 'john.smith@example.com',
        phoneNumber: '+1-555-0123',
        role: 'closer',
        payType: 'standard',
        managerType: 'Team Lead',
        operationsPrivilege: true,
        organizationBuildingPrivileges: false,
        office: 'Lancaster',
        active: true,
        dealCount: 15,
        totalCommission: 45000
      },
      {
        id: '2',
        uid: '2',
        displayName: 'Sarah Johnson',
        email: 'sarah.johnson@example.com',
        phoneNumber: '+1-555-0124',
        role: 'setter',
        payType: 'vet',
        managerType: 'Manager',
        operationsPrivilege: true,
        organizationBuildingPrivileges: true,
        office: 'Lancaster',
        active: true,
        dealCount: 8,
        totalCommission: 12000
      },
      {
        id: '3',
        uid: '3',
        displayName: 'Mike Davis',
        email: 'mike.davis@example.com',
        phoneNumber: '+1-555-0125',
        role: 'closer',
        payType: 'standard',
        managerType: 'Area Manager',
        operationsPrivilege: false,
        organizationBuildingPrivileges: true,
        office: 'Lancaster',
        active: true,
        dealCount: 22,
        totalCommission: 66000
      },
      {
        id: '4',
        uid: '4',
        displayName: 'Emily Wilson',
        email: 'emily.wilson@example.com',
        phoneNumber: '+1-555-0126',
        role: 'setter',
        payType: 'rookie',
        managerType: 'Team Lead',
        operationsPrivilege: false,
        organizationBuildingPrivileges: false,
        office: 'Lancaster',
        active: true,
        dealCount: 5,
        totalCommission: 3000
      },
      {
        id: '5',
        uid: '5',
        displayName: 'David Brown',
        email: 'david.brown@example.com',
        phoneNumber: '+1-555-0127',
        role: 'closer',
        payType: 'standard',
        managerType: 'Regional',
        operationsPrivilege: true,
        organizationBuildingPrivileges: true,
        office: 'Lancaster',
        active: true,
        dealCount: 30,
        totalCommission: 90000
      },
      {
        id: '6',
        uid: '6',
        displayName: 'Lisa Garcia',
        email: 'lisa.garcia@example.com',
        phoneNumber: '+1-555-0128',
        role: 'setter',
        payType: 'pro',
        managerType: 'Manager',
        operationsPrivilege: true,
        organizationBuildingPrivileges: false,
        office: 'Lancaster',
        active: true,
        dealCount: 12,
        totalCommission: 18000
      }
    ];
    setAllUsers(mockUsers);
    setFilteredUsers(mockUsers);
  };

  // Filter users based on search term and filters
  useEffect(() => {
    let filtered = allUsers;

    if (searchTerm) {
      filtered = filtered.filter(user =>
        user.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.phoneNumber?.includes(searchTerm)
      );
    }

    if (filterRole !== 'all') {
      filtered = filtered.filter(user => user.role === filterRole);
    }

    if (filterOffice !== 'all') {
      filtered = filtered.filter(user => user.office === filterOffice);
    }

    setFilteredUsers(filtered);
  }, [allUsers, searchTerm, filterRole, filterOffice]);

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'closer':
        return <Crown className="h-4 w-4 text-yellow-500" />;
      case 'setter':
        return <Users className="h-4 w-4 text-blue-500" />;
      default:
        return <Users className="h-4 w-4 text-gray-500" />;
    }
  };

  const getManagerTypeIcon = (managerType: string) => {
    switch (managerType) {
      case 'Regional':
        return <Crown className="h-4 w-4 text-purple-500" />;
      case 'Area Manager':
        return <Building className="h-4 w-4 text-green-500" />;
      case 'Manager':
        return <Building className="h-4 w-4 text-blue-500" />;
      case 'Team Lead':
        return <Users className="h-4 w-4 text-orange-500" />;
      default:
        return <Users className="h-4 w-4 text-gray-500" />;
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen bg-black">
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500"></div>
        </div>
      </div>
    );
  }

  const handleSignOut = async () => {
    try {
      await signOut?.();
    } catch (error) {
      console.error('Error signing out:', error);
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
      
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-black border-b border-gray-600 px-6 py-4">
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
              <h1 className="text-xl font-semibold text-white">Rep Directory</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <MessagesButton />
              <button
                onClick={toggleTheme}
                className="p-2 rounded-lg bg-black text-gray-400 hover:text-white transition-colors"
              >
                {darkMode ? '☀️' : '🌙'}
              </button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-auto p-6">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-white mb-2">Rep Management</h1>
              <p className="text-gray-300">Admin view for managing rep accounts and settings</p>
            </div>


            {/* Search and Filters */}
            <div className="bg-black rounded-lg p-4 mb-6 border border-gray-600">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <input
                      type="text"
                      placeholder="Search by name, email, or phone..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 bg-black border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    />
                  </div>
                </div>
                
                <div className="flex gap-4">
                  <select
                    value={filterRole}
                    onChange={(e) => setFilterRole(e.target.value)}
                    className="px-4 py-2 bg-black border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  >
                    <option value="all">All Roles</option>
                    <option value="setter">Setters</option>
                    <option value="closer">Closers</option>
                  </select>
                  
                  <select
                    value={filterOffice}
                    onChange={(e) => setFilterOffice(e.target.value)}
                    className="px-4 py-2 bg-black border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  >
                    <option value="all">All Offices</option>
                    <option value="Lancaster">Lancaster</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Admin Management Table */}
            <div className="bg-black rounded-lg border border-gray-600 overflow-hidden">
              <div className="p-6 border-b border-gray-600">
                <h2 className="text-xl font-semibold text-white mb-2">Rep Account Management</h2>
                <p className="text-gray-400">Showing {filteredUsers.length} of {allUsers.length} reps</p>
              </div>
              
              <div className="overflow-x-auto">
                {filteredUsers.length === 0 ? (
                  <div className="text-center py-12">
                    <Users className="h-12 w-12 text-gray-500 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-400 mb-2">No Representatives Found</h3>
                    <p className="text-gray-500">No representatives match your current filters.</p>
                  </div>
                ) : (
                  <table className="w-full">
                    <thead className="bg-gray-800 border-b border-gray-600">
                      <tr>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-white">Rep Name</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-white">Rep Type</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-white">Pay Type</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-white">Manager Type</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-white">Operations Privilege</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-white">Organization Building Privileges</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-white">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-600">
                      {filteredUsers.map((rep) => (
                        <tr key={rep.uid} className="hover:bg-gray-800 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 bg-cyan-600 rounded-full flex items-center justify-center">
                                <span className="text-white font-semibold text-sm">
                                  {rep.displayName?.charAt(0) || 'U'}
                                </span>
                              </div>
                              <div>
                                <div className="font-medium text-white">{rep.displayName || 'Unknown'}</div>
                                <div className="text-sm text-gray-400">{rep.email}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center space-x-2">
                              {getRoleIcon(rep.role || '')}
                              <span className="text-white capitalize">{rep.role || 'Not Set'}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-white capitalize">{rep.payType || 'Not Set'}</span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center space-x-2">
                              {rep.managerType && getManagerTypeIcon(rep.managerType)}
                              <span className="text-white">{rep.managerType || 'Not Set'}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              rep.operationsPrivilege 
                                ? 'bg-green-900 text-green-300' 
                                : 'bg-red-900 text-red-300'
                            }`}>
                              {rep.operationsPrivilege ? 'Yes' : 'No'}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              rep.organizationBuildingPrivileges 
                                ? 'bg-green-900 text-green-300' 
                                : 'bg-red-900 text-red-300'
                            }`}>
                              {rep.organizationBuildingPrivileges ? 'Yes' : 'No'}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <button className="px-3 py-1 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors text-sm">
                              Edit
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
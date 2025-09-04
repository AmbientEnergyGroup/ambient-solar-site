"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/contexts/AuthContext";
import { getAllUsers, getAllProjects, UserData, Project as FirebaseProject } from "@/lib/firebase/firebaseUtils";
import Sidebar from "@/components/Sidebar";
import { useTheme } from "@/lib/hooks/useTheme";
import AmbientLogo from "@/components/AmbientLogo";
import {
  Search,
  Filter,
  Download,
  BarChart3,
  Users,
  Calendar,
  DollarSign,
  Zap,
  ChevronDown,
  ChevronUp
} from "lucide-react";

interface ProjectWithUser extends FirebaseProject {
  userName: string;
  userEmail: string;
  userRole: string;
}

export default function Pipeline() {
  const { user, loading } = useAuth();
  const { darkMode, toggleDarkMode } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [allProjects, setAllProjects] = useState<ProjectWithUser[]>([]);
  const [allUsers, setAllUsers] = useState<UserData[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'cancelled' | 'completed' | 'site_survey' | 'permit' | 'install' | 'inspection' | 'pto'>('all');
  const [sortBy, setSortBy] = useState<'date' | 'name' | 'value' | 'user' | 'status'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  // Check if user is admin
  if (!loading && user?.role !== 'admin') {
    return (
      <div className="flex h-screen theme-bg-primary">
        <Sidebar 
          signOut={() => {}} 
          darkMode={darkMode} 
          sidebarOpen={sidebarOpen} 
          setSidebarOpen={setSidebarOpen} 
        />
        <div className="flex-1 flex flex-col">
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <h1 className="text-2xl font-bold theme-text-primary mb-4">Access Denied</h1>
              <p className="theme-text-secondary">You need admin privileges to view the pipeline.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Load all projects from all users
  const loadAllProjects = async () => {
    if (!user) return;
    
    setLoadingProjects(true);
    try {
      // Get all users and all projects in parallel
      const [users, projects] = await Promise.all([
        getAllUsers(),
        getAllProjects()
      ]);

      setAllUsers(users);

      // Create a map of users for quick lookup
      const userMap = new Map(users.map(user => [user.id, user]));

      // Enrich projects with user information
      const projectsWithUsers: ProjectWithUser[] = projects.map(project => {
        const userData = userMap.get(project.userId);
        return {
          ...project,
          userName: userData?.displayName || 'Unknown User',
          userEmail: userData?.email || 'No Email',
          userRole: userData?.role || 'Unknown Role'
        };
      });

      setAllProjects(projectsWithUsers);
    } catch (error) {
      console.error('Error loading all projects:', error);
    } finally {
      setLoadingProjects(false);
    }
  };

  useEffect(() => {
    if (user?.role === 'admin') {
      loadAllProjects();
    }
  }, [user]);

  // Filter and sort projects
  const getFilteredProjects = () => {
    let filtered = allProjects.filter(project => {
      const matchesSearch = project.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           project.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           project.userName.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || project.status === statusFilter;
      return matchesSearch && matchesStatus;
    });

    // Sort projects
    filtered.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'date':
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
        case 'name':
          comparison = a.customerName.localeCompare(b.customerName);
          break;
        case 'value':
          comparison = (a.paymentAmount || 0) - (b.paymentAmount || 0);
          break;
        case 'user':
          comparison = a.userName.localeCompare(b.userName);
          break;
        case 'status':
          comparison = a.status.localeCompare(b.status);
          break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return filtered;
  };

  const toggleRowExpansion = (projectId: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(projectId)) {
      newExpanded.delete(projectId);
    } else {
      newExpanded.add(projectId);
    }
    setExpandedRows(newExpanded);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'approved': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'site_survey': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'permit': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'install': return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200';
      case 'inspection': return 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200';
      case 'pto': return 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200';
      case 'completed': return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200';
      case 'cancelled': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const filteredProjects = getFilteredProjects();

  // Calculate detailed statistics
  const getDetailedStats = () => {
    const totalDeals = allProjects.length;
    const soldDeals = allProjects.filter(p => 
      p.status === 'paid' || 
      p.status === 'completed' || 
      p.status === 'pto' || 
      p.status === 'install' || 
      p.status === 'inspection' ||
      p.status === 'permit' ||
      p.status === 'site_survey' ||
      p.status === 'approved'
    ).length;
    const cancelledDeals = allProjects.filter(p => p.status === 'cancelled').length;
    const pendingDeals = allProjects.filter(p => p.status === 'pending').length;
    const totalRevenue = allProjects.reduce((sum, p) => sum + (p.paymentAmount || 0), 0);
    const activeUsers = new Set(allProjects.map(p => p.userId)).size;
    
    return {
      totalDeals,
      soldDeals,
      cancelledDeals,
      pendingDeals,
      totalRevenue,
      activeUsers,
      conversionRate: totalDeals > 0 ? ((soldDeals / totalDeals) * 100).toFixed(1) : '0.0'
    };
  };

  const stats = getDetailedStats();

  if (loading) {
    return (
      <div className="flex h-screen theme-bg-primary">
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen theme-bg-primary">
      <Sidebar 
        signOut={() => {}} 
        darkMode={darkMode} 
        sidebarOpen={sidebarOpen} 
        setSidebarOpen={setSidebarOpen} 
      />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="theme-bg-secondary border-b theme-border-secondary px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="mr-4 p-2 rounded-md theme-text-secondary hover:theme-bg-tertiary transition-colors duration-200"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <div>
                <h1 className="text-2xl font-bold theme-text-primary">Pipeline</h1>
                <p className="theme-text-secondary">All projects across the organization</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={toggleDarkMode}
                className="p-2 rounded-md theme-text-secondary hover:theme-bg-tertiary transition-colors duration-200"
              >
                {darkMode ? '☀️' : '🌙'}
              </button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="theme-bg-secondary rounded-lg p-6 border theme-border-secondary">
              <div className="flex items-center">
                <div className="p-2 bg-cyan-100 dark:bg-cyan-900 rounded-lg">
                  <BarChart3 className="h-6 w-6 text-cyan-600 dark:text-cyan-400" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium theme-text-secondary">Total Deals</p>
                  <p className="text-2xl font-bold theme-text-primary">{stats.totalDeals}</p>
                  <p className="text-xs theme-text-secondary">All projects across users</p>
                </div>
              </div>
            </div>

            <div className="theme-bg-secondary rounded-lg p-6 border theme-border-secondary">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                  <Zap className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium theme-text-secondary">Sold Deals</p>
                  <p className="text-2xl font-bold theme-text-primary">{stats.soldDeals}</p>
                  <p className="text-xs theme-text-secondary">Active & completed deals</p>
                </div>
              </div>
            </div>

            <div className="theme-bg-secondary rounded-lg p-6 border theme-border-secondary">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                  <DollarSign className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium theme-text-secondary">Total Revenue</p>
                  <p className="text-2xl font-bold theme-text-primary">
                    ${stats.totalRevenue.toLocaleString()}
                  </p>
                  <p className="text-xs theme-text-secondary">All deal values combined</p>
                </div>
              </div>
            </div>

            <div className="theme-bg-secondary rounded-lg p-6 border theme-border-secondary">
              <div className="flex items-center">
                <div className="p-2 bg-red-100 dark:bg-red-900 rounded-lg">
                  <Calendar className="h-6 w-6 text-red-600 dark:text-red-400" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium theme-text-secondary">Cancelled</p>
                  <p className="text-2xl font-bold theme-text-primary">{stats.cancelledDeals}</p>
                  <p className="text-xs theme-text-secondary">Lost opportunities</p>
                </div>
              </div>
            </div>
          </div>

          {/* Filters and Search */}
          <div className="theme-bg-secondary rounded-lg p-6 border theme-border-secondary mb-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 theme-text-secondary" />
                  <input
                    type="text"
                    placeholder="Search projects, customers, or users..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border theme-border-secondary rounded-md theme-bg-primary theme-text-primary focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  />
                </div>
              </div>
              
              <div className="flex gap-4">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="px-4 py-2 border theme-border-secondary rounded-md theme-bg-primary theme-text-primary focus:ring-2 focus:ring-cyan-500"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="site_survey">Site Survey</option>
                  <option value="permit">Permit</option>
                  <option value="install">Install</option>
                  <option value="inspection">Inspection</option>
                  <option value="pto">PTO</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>

                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="px-4 py-2 border theme-border-secondary rounded-md theme-bg-primary theme-text-primary focus:ring-2 focus:ring-cyan-500"
                >
                  <option value="date">Sort by Date</option>
                  <option value="name">Sort by Name</option>
                  <option value="value">Sort by Value</option>
                  <option value="user">Sort by User</option>
                  <option value="status">Sort by Status</option>
                </select>

                <button
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                  className="px-4 py-2 border theme-border-secondary rounded-md theme-bg-primary theme-text-primary hover:theme-bg-tertiary transition-colors duration-200"
                >
                  {sortOrder === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </div>

          {/* Projects Table */}
          <div className="theme-bg-secondary rounded-lg border theme-border-secondary overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y theme-border-secondary">
                <thead className="theme-bg-tertiary">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium theme-text-secondary uppercase tracking-wider">
                      Project Details
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium theme-text-secondary uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium theme-text-secondary uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium theme-text-secondary uppercase tracking-wider">
                      Value
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium theme-text-secondary uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium theme-text-secondary uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y theme-border-secondary">
                  {loadingProjects ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center">
                        <div className="flex flex-col items-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500 mb-4"></div>
                          <p className="text-sm theme-text-secondary">Loading projects...</p>
                        </div>
                      </td>
                    </tr>
                  ) : filteredProjects.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center">
                        <div className="flex flex-col items-center">
                          <BarChart3 className="h-12 w-12 theme-text-secondary mb-4" />
                          <h3 className="text-lg font-medium theme-text-primary mb-2">No projects found</h3>
                          <p className="text-sm theme-text-secondary">
                            {searchTerm || statusFilter !== 'all' 
                              ? 'Try adjusting your search or filters.' 
                              : 'No projects have been created yet.'}
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredProjects.map((project) => (
                      <tr key={project.id} className="hover:theme-bg-quaternary transition-colors duration-200">
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <button
                              onClick={() => toggleRowExpansion(project.id)}
                              className="mr-3 p-1 hover:theme-bg-tertiary rounded transition-colors duration-200"
                            >
                              {expandedRows.has(project.id) ? 
                                <ChevronUp className="h-4 w-4 theme-text-secondary" /> : 
                                <ChevronDown className="h-4 w-4 theme-text-secondary" />
                              }
                            </button>
                            <div>
                              <div className="text-sm font-medium theme-text-primary">{project.customerName}</div>
                              <div className="text-sm theme-text-secondary">{project.address}</div>
                              {expandedRows.has(project.id) && (
                                <div className="mt-2 text-xs theme-text-secondary">
                                  <p><strong>System Size:</strong> {project.systemSize} kW</p>
                                  <p><strong>Project ID:</strong> {project.id}</p>
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm theme-text-primary">{project.userName}</div>
                          <div className="text-sm theme-text-secondary">{project.userEmail}</div>
                          <div className="text-xs theme-text-secondary capitalize">{project.userRole}</div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(project.status)}`}>
                            {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium theme-text-primary">${(project.paymentAmount || 0).toLocaleString()}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm theme-text-primary">
                            {new Date(project.createdAt).toLocaleDateString()}
                          </div>
                          <div className="text-xs theme-text-secondary">
                            {new Date(project.createdAt).toLocaleTimeString()}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex space-x-2">
                            <button className="text-cyan-600 hover:text-cyan-800 text-sm font-medium">
                              View
                            </button>
                            <button className="text-gray-600 hover:text-gray-800 text-sm font-medium">
                              Edit
                            </button>
                          </div>
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
  );
}
"use client";

import { useState, useEffect } from "react";
import MessagesButton from "@/components/MessagesButton";

import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/hooks/useAuth";
import { BarChart3, Users, LogOut, Home, Map, Search, Filter, Award, TrendingUp, Calendar, ChevronDown, X, DollarSign, CheckCircle, Clock } from "lucide-react";
import AmbientLogo from "@/components/AmbientLogo";
import Sidebar from "@/components/Sidebar";
import { useTheme } from "@/lib/hooks/useTheme";

// Define the user type for leaderboard
interface LeaderboardUser {
  id: string;
  name: string;
  avatar: string;
  role: string;
  metrics: {
    salesWeek: number;
    salesMonth: number;
    salesTotal: number;
    doorsKnocked: number;
    appointmentsSet: number;
    billsPulled: number;
    conversionRate: number;
    // Additional metrics for the detail view
    lifetimeRevenue: number;
    downlineSales: number;
    teamSize: number;
    areasCovered: string[];
    startDate: string;
    streak: number;
    salesGoal: number;
  };
}

// Mock data for the leaderboard
const mockUsers: LeaderboardUser[] = [
  {
    id: "1",
    name: "Alex Johnson",
    avatar: "/avatars/user-1.jpg",
    role: "Veteran Rep",
    metrics: {
      salesWeek: 8,
      salesMonth: 24,
      salesTotal: 142,
      doorsKnocked: 285,
      appointmentsSet: 28,
      billsPulled: 94,
      conversionRate: 9.82,
      lifetimeRevenue: 1245000,
      downlineSales: 32,
      teamSize: 3,
      areasCovered: ["North Valley", "Westlake", "Downtown"],
      startDate: "2021-05-12",
      streak: 8,
      salesGoal: 150
    }
  },
  {
    id: "2",
    name: "Taylor Smith",
    avatar: "/avatars/user-2.jpg",
    role: "Pro Rep",
    metrics: {
      salesWeek: 10,
      salesMonth: 32,
      salesTotal: 187,
      doorsKnocked: 320,
      appointmentsSet: 35,
      billsPulled: 116,
      conversionRate: 10.94,
      lifetimeRevenue: 1653000,
      downlineSales: 47,
      teamSize: 5,
      areasCovered: ["East Hills", "Southside", "Lakefront"],
      startDate: "2020-08-23",
      streak: 12,
      salesGoal: 150
    }
  },
  {
    id: "3",
    name: "Morgan Davis",
    avatar: "/avatars/user-3.jpg",
    role: "Intern Rep",
    metrics: {
      salesWeek: 5,
      salesMonth: 18,
      salesTotal: 97,
      doorsKnocked: 215,
      appointmentsSet: 22,
      billsPulled: 73,
      conversionRate: 10.23,
      lifetimeRevenue: 862000,
      downlineSales: 0,
      teamSize: 0,
      areasCovered: ["Westpark", "Central District"],
      startDate: "2022-01-15",
      streak: 3,
      salesGoal: 100
    }
  },
  {
    id: "4",
    name: "Jordan Wilson",
    avatar: "/avatars/user-4.jpg",
    role: "Veteran Rep",
    metrics: {
      salesWeek: 7,
      salesMonth: 26,
      salesTotal: 118,
      doorsKnocked: 245,
      appointmentsSet: 31,
      billsPulled: 89,
      conversionRate: 12.65,
      lifetimeRevenue: 1038000,
      downlineSales: 0,
      teamSize: 0,
      areasCovered: ["North Heights", "Westridge"],
      startDate: "2021-11-03",
      streak: 6,
      salesGoal: 100
    }
  },
  {
    id: "5",
    name: "Casey Lee",
    avatar: "/avatars/user-5.jpg",
    role: "Intern Rep",
    metrics: {
      salesWeek: 3,
      salesMonth: 12,
      salesTotal: 64,
      doorsKnocked: 178,
      appointmentsSet: 17,
      billsPulled: 52,
      conversionRate: 9.55,
      lifetimeRevenue: 564000,
      downlineSales: 0,
      teamSize: 0,
      areasCovered: ["South Valley"],
      startDate: "2022-06-28",
      streak: 2,
      salesGoal: 75
    }
  },
  {
    id: "6",
    name: "Riley Garcia",
    avatar: "/avatars/user-6.jpg",
    role: "Intern Rep",
    metrics: {
      salesWeek: 6,
      salesMonth: 19,
      salesTotal: 108,
      doorsKnocked: 230,
      appointmentsSet: 26,
      billsPulled: 84,
      conversionRate: 11.30,
      lifetimeRevenue: 952000,
      downlineSales: 0,
      teamSize: 0,
      areasCovered: ["East Quarter", "Northside"],
      startDate: "2021-09-17",
      streak: 5,
      salesGoal: 80
    }
  },
  {
    id: "7",
    name: "Avery Martinez",
    avatar: "/avatars/user-7.jpg",
    role: "Pro Rep",
    metrics: {
      salesWeek: 9,
      salesMonth: 28,
      salesTotal: 156,
      doorsKnocked: 310,
      appointmentsSet: 33,
      billsPulled: 102,
      conversionRate: 10.65,
      lifetimeRevenue: 1372000,
      downlineSales: 28,
      teamSize: 2,
      areasCovered: ["Hillcrest", "Valley View", "Riverbend"],
      startDate: "2021-03-05",
      streak: 9,
      salesGoal: 150
    }
  },
  {
    id: "8",
    name: "Dakota Robinson",
    avatar: "/avatars/user-8.jpg",
    role: "Veteran Rep",
    metrics: {
      salesWeek: 4,
      salesMonth: 16,
      salesTotal: 88,
      doorsKnocked: 194,
      appointmentsSet: 19,
      billsPulled: 67,
      conversionRate: 9.79,
      lifetimeRevenue: 783000,
      downlineSales: 0,
      teamSize: 0,
      areasCovered: ["West Central", "Parkview"],
      startDate: "2022-02-19",
      streak: 4,
      salesGoal: 100
    }
  }
];

// Time period options for filtering
const timePeriods = [
  { label: "This Week", value: "week" },
  { label: "This Month", value: "month" },
  { label: "This Quarter", value: "quarter" },
  { label: "This Year", value: "year" },
  { label: "All Time", value: "all" }
];

// Metric options for ranking
const metricOptions = [
  { label: "Sales", value: "sales" },
  { label: "Doors Knocked", value: "doorsKnocked" },
  { label: "Appointments Set", value: "appointmentsSet" },
  { label: "Bills Pulled", value: "billsPulled" },
  { label: "Conversion Rate", value: "conversionRate" }
];

// Define badge type to fix type issues
interface Badge {
  id: string;
  title: string;
  icon?: React.ReactNode;
  content?: string;
  bgColor: string;
  borderColor: string;
  glowColor: string;
}

// Extract badge component logic into a reusable function
const getBadges = (user: LeaderboardUser): Badge[] => {
  const badges = [];
  
  // Sales Leader badge (for top performers)
  if (user.metrics.salesTotal > 150) {
    badges.push({
      id: "sales-leader",
      title: "Sales Leader",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-amber-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      bgColor: "bg-gradient-to-br from-amber-600 to-amber-800",
      borderColor: "border-amber-500",
      glowColor: "shadow-amber-500/30"
    });
  }
  
  // Streak badge
  if (user.metrics.streak >= 5) {
    badges.push({
      id: "streak",
      title: `${user.metrics.streak} Day Streak`,
      content: `${user.metrics.streak}D`,
      bgColor: "bg-gradient-to-br from-purple-600 to-purple-900",
      borderColor: "border-purple-500",
      glowColor: "shadow-purple-500/30"
    });
  }
  
  // Century Club badge
  if (user.metrics.salesTotal >= 100) {
    badges.push({
      id: "century",
      title: "Century Club (100+ Sales)",
      content: "100+",
      bgColor: "bg-gradient-to-br from-blue-600 to-blue-900",
      borderColor: "border-blue-400",
      glowColor: "shadow-blue-500/30"
    });
  }
  
  // High Converter badge
  if (user.metrics.conversionRate > 10) {
    badges.push({
      id: "converter",
      title: "High Converter (>10%)",
      content: "10%+",
      bgColor: "bg-gradient-to-br from-green-600 to-green-900",
      borderColor: "border-green-400",
      glowColor: "shadow-green-500/30"
    });
  }
  
  // Team Leader badge
  if (user.metrics.teamSize >= 3) {
    badges.push({
      id: "team-leader",
      title: "Team Leader",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
      bgColor: "bg-gradient-to-br from-blue-500 to-indigo-700",
      borderColor: "border-blue-400",
      glowColor: "shadow-blue-500/30"
    });
  }
  
  // Veteran badge (for those with 2+ years of experience)
  const startDate = new Date(user.metrics.startDate);
  const today = new Date();
  const yearDiff = today.getFullYear() - startDate.getFullYear();
  if (yearDiff >= 2) {
    badges.push({
      id: "veteran",
      title: "Veteran (2+ Years)",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      bgColor: "bg-gradient-to-br from-gray-600 to-gray-800",
      borderColor: "border-gray-500",
      glowColor: "shadow-white/20"
    });
  }
  
  return badges;
};

// Badge component for leaderboard table (smaller version)
const LeaderboardBadge = ({ badge }: { badge: Badge }) => {
  return (
    <div 
      className={`w-6 h-6 ${badge.bgColor} rounded-full flex items-center justify-center border ${badge.borderColor} shadow-lg ${badge.glowColor}`}
      title={badge.title}
    >
      {badge.icon ? badge.icon : <span className="text-white font-bold text-[10px]">{badge.content}</span>}
    </div>
  );
};

// Badge component for detail view (larger version)
const DetailBadge = ({ badge }: { badge: Badge }) => {
  return (
    <div 
      className={`w-12 h-12 ${badge.bgColor} rounded-full flex items-center justify-center border-2 ${badge.borderColor} shadow-lg ${badge.glowColor}`}
      title={badge.title}
    >
      {badge.icon ? 
        <div className="scale-150">{badge.icon}</div> : 
        <span className="text-white font-bold text-sm">{badge.content}</span>
      }
    </div>
  );
};

export default function Leaderboard() {
  const [users, setUsers] = useState<LeaderboardUser[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [timePeriod, setTimePeriod] = useState("week");
  const [metric, setMetric] = useState("sales");
  const [showTimeDropdown, setShowTimeDropdown] = useState(false);
  const [showMetricDropdown, setShowMetricDropdown] = useState(false);
  const [selectedDetailUser, setSelectedDetailUser] = useState<LeaderboardUser | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const { user, loading, signOut } = useAuth();
  const router = useRouter();
  const { darkMode } = useTheme();

  // Function to format large numbers
  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return `$${(num / 1000000).toFixed(1)}M`;
    } else if (num >= 1000) {
      return `$${(num / 1000).toFixed(1)}K`;
    }
    return `$${num}`;
  };

  // Function to format date
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
  };

  // Function to calculate experience in years and months
  const calculateExperience = (startDate: string): string => {
    const start = new Date(startDate);
    const today = new Date();
    
    const yearDiff = today.getFullYear() - start.getFullYear();
    const monthDiff = today.getMonth() - start.getMonth();
    
    let years = yearDiff;
    let months = monthDiff;
    
    if (monthDiff < 0) {
      years--;
      months += 12;
    }
    
    if (years === 0) {
      return `${months} month${months !== 1 ? 's' : ''}`;
    } else if (months === 0) {
      return `${years} year${years !== 1 ? 's' : ''}`;
    } else {
      return `${years} year${years !== 1 ? 's' : ''}, ${months} month${months !== 1 ? 's' : ''}`;
    }
  };

  // Function to show user detail card
  const handleShowUserDetail = (user: LeaderboardUser) => {
    setSelectedDetailUser(user);
    setShowDetailModal(true);
  };

  // Load and sort users based on the selected metric and time period
  useEffect(() => {
    // In a real app, this would fetch from an API
    const loadedUsers = [...mockUsers];
    
    // Sort users based on the selected metric and time period
    loadedUsers.sort((a, b) => {
      let valA, valB;
      
      if (metric === "sales") {
        if (timePeriod === "week") {
          valA = a.metrics.salesWeek;
          valB = b.metrics.salesWeek;
        } else if (timePeriod === "month") {
          valA = a.metrics.salesMonth;
          valB = b.metrics.salesMonth;
        } else {
          valA = a.metrics.salesTotal;
          valB = b.metrics.salesTotal;
        }
      } else {
        valA = a.metrics[metric as keyof typeof a.metrics] as number;
        valB = b.metrics[metric as keyof typeof b.metrics] as number;
      }
      
      return valB - valA; // Descending order
    });
    
    setUsers(loadedUsers);
  }, [timePeriod, metric]);

  // Redirect to home if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push("/");
    }
  }, [user, loading, router]);

  // Filter users by search term
  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Calculate the value to display based on the selected metric and time period
  const getDisplayValue = (user: LeaderboardUser) => {
    if (metric === "sales") {
      if (timePeriod === "week") {
        return user.metrics.salesWeek;
      } else if (timePeriod === "month") {
        return user.metrics.salesMonth;
      } else {
        return user.metrics.salesTotal;
      }
    } else if (metric === "conversionRate") {
      return `${user.metrics[metric]}%`;
    } else {
      return user.metrics[metric as keyof typeof user.metrics];
    }
  };

  // Get the metric display name for the leaderboard heading
  const getMetricDisplayName = () => {
    const option = metricOptions.find(option => option.value === metric);
    return option ? option.label : "Sales";
  };

  // Get the time period display name for the leaderboard heading
  const getTimePeriodDisplayName = () => {
    const option = timePeriods.find(option => option.value === timePeriod);
    return option ? option.label : "This Week";
  };

  // Function to get the user profile image
  const getUserProfileImage = (userId: string): string | undefined => {
    // In a real app with multiple users, we would use a user ID
    // For this demo, we'll just use the localStorage value
    const image = localStorage.getItem("profileImage");
    return image || undefined;
  };

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen theme-bg-primary">
        <div className={`animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 ${darkMode ? 'border-amber-500' : 'border-blue-500'}`}></div>
      </div>
    );
  }

  // If user is not authenticated and not loading, this will render briefly before redirect
  if (!user) {
    return null;
  }

  return (
    <div className="flex h-screen theme-bg-primary">
      {/* Sidebar - Using the shared component */}
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
            <div className="flex items-center mb-4">
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

              {/* Centered logo when sidebar is closed */}
              {!sidebarOpen && (
                <div className="header-logo-center">
                  <AmbientLogo theme={darkMode ? 'dark' : 'light'} size="xl" />
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Leaderboard Content */}
        <div className="p-6">
          {/* Filters */}
          <div className="flex flex-wrap items-center justify-between mb-6 gap-4">
            <div className="flex items-center gap-4">
              {/* Replace existing Time Period Dropdown with theme-aware classes */}
              <div className="relative">
                <button 
                  onClick={() => {
                    setShowTimeDropdown(!showTimeDropdown);
                    setShowMetricDropdown(false);
                  }}
                  className="theme-bg-tertiary theme-text-primary flex items-center gap-2 px-3 py-2 rounded-lg border theme-border-primary"
                >
                  <Calendar className="h-4 w-4" />
                  <span>{getTimePeriodDisplayName()}</span>
                  <ChevronDown className="h-4 w-4" />
                </button>
                {showTimeDropdown && (
                  <div className="absolute mt-1 p-1 w-40 theme-bg-tertiary rounded-lg shadow-lg border theme-border-primary z-10">
                    <button 
                      onClick={() => {
                        setTimePeriod("week");
                        setShowTimeDropdown(false);
                      }}
                      className={`w-full text-left px-3 py-2 rounded flex items-center ${timePeriod === 'week' ? (darkMode ? 'bg-amber-500 text-gray-900' : 'bg-blue-500 text-white') : 'theme-text-primary hover:theme-text-secondary'}`}
                    >
                      This Week
                    </button>
                    <button 
                      onClick={() => {
                        setTimePeriod("month");
                        setShowTimeDropdown(false);
                      }}
                      className={`w-full text-left px-3 py-2 rounded flex items-center ${timePeriod === 'month' ? (darkMode ? 'bg-amber-500 text-gray-900' : 'bg-blue-500 text-white') : 'theme-text-primary hover:theme-text-secondary'}`}
                    >
                      This Month
                    </button>
                  </div>
                )}
              </div>

              {/* Replace existing Metric Dropdown with theme-aware classes */}
              <div className="relative">
                <button 
                  onClick={() => {
                    setShowMetricDropdown(!showMetricDropdown);
                    setShowTimeDropdown(false);
                  }}
                  className="theme-bg-tertiary theme-text-primary flex items-center gap-2 px-3 py-2 rounded-lg border theme-border-primary"
                >
                  <TrendingUp className="h-4 w-4" />
                  <span>{getMetricDisplayName()}</span>
                  <ChevronDown className="h-4 w-4" />
                </button>
                {showMetricDropdown && (
                  <div className="absolute mt-1 p-1 w-48 theme-bg-tertiary rounded-lg shadow-lg border theme-border-primary z-10">
                    <button 
                      onClick={() => {
                        setMetric("sales");
                        setShowMetricDropdown(false);
                      }}
                      className={`w-full text-left px-3 py-2 rounded flex items-center ${metric === 'sales' ? (darkMode ? 'bg-amber-500 text-gray-900' : 'bg-blue-500 text-white') : 'theme-text-primary hover:theme-text-secondary'}`}
                    >
                      Sales
                    </button>
                    <button 
                      onClick={() => {
                        setMetric("doors");
                        setShowMetricDropdown(false);
                      }}
                      className={`w-full text-left px-3 py-2 rounded flex items-center ${metric === 'doors' ? (darkMode ? 'bg-amber-500 text-gray-900' : 'bg-blue-500 text-white') : 'theme-text-primary hover:theme-text-secondary'}`}
                    >
                      Doors Knocked
                    </button>
                    <button 
                      onClick={() => {
                        setMetric("appointments");
                        setShowMetricDropdown(false);
                      }}
                      className={`w-full text-left px-3 py-2 rounded flex items-center ${metric === 'appointments' ? (darkMode ? 'bg-amber-500 text-gray-900' : 'bg-blue-500 text-white') : 'theme-text-primary hover:theme-text-secondary'}`}
                    >
                      Appointments Set
                    </button>
                    <button 
                      onClick={() => {
                        setMetric("bills");
                        setShowMetricDropdown(false);
                      }}
                      className={`w-full text-left px-3 py-2 rounded flex items-center ${metric === 'bills' ? (darkMode ? 'bg-amber-500 text-gray-900' : 'bg-blue-500 text-white') : 'theme-text-primary hover:theme-text-secondary'}`}
                    >
                      Bills Pulled
                    </button>
                    <button 
                      onClick={() => {
                        setMetric("conversion");
                        setShowMetricDropdown(false);
                      }}
                      className={`w-full text-left px-3 py-2 rounded flex items-center ${metric === 'conversion' ? (darkMode ? 'bg-amber-500 text-gray-900' : 'bg-blue-500 text-white') : 'theme-text-primary hover:theme-text-secondary'}`}
                    >
                      Conversion Rate
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Search */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <Search className="h-4 w-4 theme-text-secondary" />
              </div>
              <input 
                type="text" 
                className="pl-10 pr-4 py-2 theme-bg-tertiary theme-text-primary border theme-border-primary rounded-lg focus:outline-none focus:ring-2 ring-amber-500/20"
                placeholder="Search by name..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          
          {/* Leaderboard Table */}
          <div className="theme-bg-tertiary rounded-xl shadow-xl border theme-border-primary overflow-hidden">
            <div className="px-6 py-4 theme-bg-tertiary border-b theme-border-primary">
              <h2 className="text-xl font-semibold theme-text-primary flex items-center gap-2">
                <Award className="h-6 w-6" style={{color: 'var(--accent-primary)'}} />
                <span>Top Performers - {getMetricDisplayName()} ({getTimePeriodDisplayName()})</span>
              </h2>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="theme-bg-quaternary theme-text-secondary">
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider w-16">Rank</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">User</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Role</th>
                    <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider">{getMetricDisplayName()}</th>
                    <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider">Conversion</th>
                    <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y theme-border-primary theme-bg-tertiary">
                  {filteredUsers.map((user, index) => (
                    <tr 
                      key={user.id}
                      className="hover:theme-bg-quaternary transition-colors duration-150"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="inline-flex items-center justify-center w-8 h-8 rounded-full font-semibold theme-bg-quaternary theme-text-primary">
                          <span className="text-sm">{index + 1}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full theme-bg-quaternary flex items-center justify-center theme-text-primary font-medium overflow-hidden">
                              {getUserProfileImage(user.id) ? (
                                <img 
                                  src={getUserProfileImage(user.id)} 
                                  alt={user.name}
                                  className="h-full w-full object-cover" 
                                />
                              ) : (
                                user.name.split(' ').map(n => n[0]).join('')
                              )}
                            </div>
                          </div>
                          <div className="ml-4 flex items-center">
                            <div className="text-sm font-medium theme-text-primary">{user.name}</div>
                            {/* Badges display in leaderboard */}
                            <div className="flex -space-x-1 ml-2">
                              {getBadges(user).map((badge, index) => (
                                <LeaderboardBadge key={badge.id} badge={badge} />
                              ))}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm theme-text-secondary">{user.role}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="text-sm font-semibold theme-text-primary">{getDisplayValue(user)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="text-sm theme-text-secondary">{user.metrics.conversionRate}%</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <button 
                          className="px-3 py-1 rounded-lg theme-bg-quaternary theme-text-primary text-xs font-medium hover:opacity-90 transition-colors duration-150"
                          onClick={() => handleShowUserDetail(user)}
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          
          {/* Additional Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
            {/* Total Sales Card */}
            <div className="card theme-bg-tertiary p-5 border theme-border-primary">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="theme-text-secondary text-sm font-medium uppercase tracking-wider">Total Sales</h3>
                  <p className="text-3xl font-bold theme-text-primary mt-2">
                    {users.reduce((total, user) => total + user.metrics.salesTotal, 0)}
                  </p>
                  <p className="text-sm theme-text-secondary mt-1">Across all team members</p>
                </div>
                <div className="bg-opacity-20 p-3 rounded-lg" style={{backgroundColor: 'var(--accent-primary)'}}>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" style={{color: 'var(--accent-primary)'}} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
              </div>
              <div className="h-px theme-bg-quaternary my-4"></div>
              <div className="flex justify-between items-center">
                <span className="text-sm theme-text-secondary">Weekly Progress</span>
                <span className="text-sm font-medium" style={{color: 'var(--accent-primary)'}}>+12.5%</span>
              </div>
            </div>
            
            {/* Average Conversion Card */}
            <div className="card theme-bg-tertiary p-5 border theme-border-primary">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="theme-text-secondary text-sm font-medium uppercase tracking-wider">Avg. Conversion Rate</h3>
                  <p className="text-3xl font-bold theme-text-primary mt-2">
                    {(users.reduce((total, user) => total + user.metrics.conversionRate, 0) / users.length).toFixed(2)}%
                  </p>
                  <p className="text-sm theme-text-secondary mt-1">Appointments to Sales</p>
                </div>
                <div className="bg-opacity-20 p-3 rounded-lg" style={{backgroundColor: 'var(--accent-primary)'}}>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" style={{color: 'var(--accent-primary)'}} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
              </div>
              <div className="h-px theme-bg-quaternary my-4"></div>
              <div className="flex justify-between items-center">
                <span className="text-sm theme-text-secondary">Monthly Change</span>
                <span className="text-sm font-medium" style={{color: 'var(--accent-primary)'}}>+2.3%</span>
              </div>
            </div>
            
            {/* Total Doors Knocked Card */}
            <div className="card theme-bg-tertiary p-5 border theme-border-primary">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="theme-text-secondary text-sm font-medium uppercase tracking-wider">Total Doors Knocked</h3>
                  <p className="text-3xl font-bold theme-text-primary mt-2">
                    {users.reduce((total, user) => total + user.metrics.doorsKnocked, 0)}
                  </p>
                  <p className="text-sm theme-text-secondary mt-1">This month</p>
                </div>
                <div className="bg-opacity-20 p-3 rounded-lg" style={{backgroundColor: 'var(--accent-primary)'}}>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" style={{color: 'var(--accent-primary)'}} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                </div>
              </div>
              <div className="h-px theme-bg-quaternary my-4"></div>
              <div className="flex justify-between items-center">
                <span className="text-sm theme-text-secondary">Daily Average</span>
                <span className="text-sm font-medium" style={{color: 'var(--accent-primary)'}}>58.3</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Rep Detail Modal (Baseball Card) */}
      {showDetailModal && selectedDetailUser && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm transition-opacity"></div>
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <div className="theme-bg-tertiary rounded-xl shadow-xl w-full max-w-3xl border theme-border-primary overflow-hidden transform transition-all">
              {/* Modal Header */}
              <div className="p-6 border-b theme-border-primary flex justify-between items-center">
                <div className="flex items-center">
                  <div className="h-12 w-12 rounded-full theme-bg-quaternary flex items-center justify-center text-xl theme-text-primary font-medium overflow-hidden">
                    {getUserProfileImage(selectedDetailUser.id) ? (
                      <img 
                        src={getUserProfileImage(selectedDetailUser.id)} 
                        alt={selectedDetailUser.name}
                        className="h-full w-full object-cover" 
                      />
                    ) : (
                      selectedDetailUser.name.split(' ').map(n => n[0]).join('')
                    )}
                  </div>
                  <div className="ml-4">
                    <h3 className="text-xl font-semibold theme-text-primary">{selectedDetailUser.name}</h3>
                    <p className="theme-text-secondary">{selectedDetailUser.role}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowDetailModal(false)}
                  className="theme-text-secondary hover:theme-text-primary transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              
              {/* Modal Content */}
              <div className="p-6">
                {/* User badges */}
                <div className="mb-6">
                  <h4 className="text-sm font-medium theme-text-secondary uppercase tracking-wider mb-2">Achievements</h4>
                  <div className="flex flex-wrap gap-3">
                    {getBadges(selectedDetailUser).map((badge) => (
                      <div key={badge.id} className="flex items-center theme-bg-quaternary rounded-full px-3 py-1.5">
                        {typeof badge.icon === 'string' ? (
                          <img src={badge.icon} alt={badge.title} className="h-5 w-5 mr-2" />
                        ) : badge.content ? (
                          <span className="h-5 w-5 mr-2 flex items-center justify-center text-xs font-bold">{badge.content}</span>
                        ) : (
                          <span className="h-5 w-5 mr-2 flex items-center justify-center text-xs font-bold">★</span>
                        )}
                        <span className="text-sm font-medium theme-text-primary">{badge.title}</span>
                      </div>
                    ))}
                    {getBadges(selectedDetailUser).length === 0 && (
                      <p className="text-sm theme-text-secondary">No achievements yet</p>
                    )}
                  </div>
                </div>
                
                {/* Performance metrics */}
                <div className="mb-6">
                  <h4 className="text-sm font-medium theme-text-secondary uppercase tracking-wider mb-4">Performance Metrics</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="theme-bg-quaternary p-4 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h5 className="text-sm theme-text-secondary">Sales</h5>
                        <DollarSign className="h-4 w-4" style={{color: 'var(--accent-primary)'}} />
                      </div>
                      <p className="text-2xl font-bold theme-text-primary">{selectedDetailUser.metrics.salesTotal}</p>
                      <div className="flex items-center mt-1">
                        <span className="text-xs theme-text-secondary mr-1">Target:</span>
                        <span className="text-xs theme-text-primary">{selectedDetailUser.metrics.salesGoal}</span>
                        <div className="ml-auto flex items-center">
                          {selectedDetailUser.metrics.salesTotal >= selectedDetailUser.metrics.salesGoal ? (
                            <span className="text-xs text-emerald-500">
                              <CheckCircle className="h-3 w-3 inline mr-1" />
                              Met
                            </span>
                          ) : (
                            <span className="text-xs" style={{color: 'var(--accent-primary)'}}>
                              <Clock className="h-3 w-3 inline mr-1" />
                              In Progress
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="theme-bg-quaternary p-4 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h5 className="text-sm theme-text-secondary">Appointments</h5>
                        <Calendar className="h-4 w-4" style={{color: 'var(--accent-primary)'}} />
                      </div>
                      <p className="text-2xl font-bold theme-text-primary">{selectedDetailUser.metrics.appointmentsSet}</p>
                      <div className="flex items-center mt-1">
                        <span className="text-xs theme-text-secondary mr-1">Target:</span>
                        <span className="text-xs theme-text-primary">{Math.round(selectedDetailUser.metrics.salesGoal * 3)}</span>
                        <div className="ml-auto flex items-center">
                          {selectedDetailUser.metrics.appointmentsSet >= Math.round(selectedDetailUser.metrics.salesGoal * 3) ? (
                            <span className="text-xs text-emerald-500">
                              <CheckCircle className="h-3 w-3 inline mr-1" />
                              Met
                            </span>
                          ) : (
                            <span className="text-xs" style={{color: 'var(--accent-primary)'}}>
                              <Clock className="h-3 w-3 inline mr-1" />
                              In Progress
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="theme-bg-quaternary p-4 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h5 className="text-sm theme-text-secondary">Doors Knocked</h5>
                        <Home className="h-4 w-4" style={{color: 'var(--accent-primary)'}} />
                      </div>
                      <p className="text-2xl font-bold theme-text-primary">{selectedDetailUser.metrics.doorsKnocked}</p>
                      <div className="flex items-center mt-1">
                        <span className="text-xs theme-text-secondary mr-1">Target:</span>
                        <span className="text-xs theme-text-primary">{Math.round(selectedDetailUser.metrics.appointmentsSet * 10)}</span>
                        <div className="ml-auto flex items-center">
                          {selectedDetailUser.metrics.doorsKnocked >= Math.round(selectedDetailUser.metrics.appointmentsSet * 10) ? (
                            <span className="text-xs text-emerald-500">
                              <CheckCircle className="h-3 w-3 inline mr-1" />
                              Met
                            </span>
                          ) : (
                            <span className="text-xs" style={{color: 'var(--accent-primary)'}}>
                              <Clock className="h-3 w-3 inline mr-1" />
                              In Progress
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Performance trends */}
                <div>
                  <h4 className="text-sm font-medium theme-text-secondary uppercase tracking-wider mb-2">Performance Trends</h4>
                  <div className="theme-bg-quaternary p-6 rounded-lg flex items-center justify-center">
                    <div className="text-center theme-text-secondary">
                      <BarChart3 className="h-8 w-8 mx-auto mb-2" />
                      <p>Performance charts coming soon</p>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Modal Footer */}
              <div className="border-t theme-border-primary p-6 flex justify-end">
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="px-4 py-2 rounded-lg theme-text-primary theme-bg-quaternary hover:opacity-90 text-sm font-medium transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 
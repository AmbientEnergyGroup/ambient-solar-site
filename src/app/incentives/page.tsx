"use client";

import { useState, useEffect } from "react";
import MessagesButton from "@/components/MessagesButton";

import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/contexts/AuthContext";
import { Gift, ChevronRight, Award, TrendingUp, Zap, Calendar, CheckCircle2, Filter, Search } from "lucide-react";
import AmbientLogo from "@/components/AmbientLogo";
import Sidebar from "@/components/Sidebar";
import { useTheme } from "@/lib/hooks/useTheme";

// Define mock incentive data
const currentIncentives = [
  {
    id: "1",
    title: "Summer Sales Challenge",
    description: "Close 10 sales in July to earn a $1,000 bonus",
    endDate: "2023-07-31",
    progress: 4,
    goal: 10,
    reward: "$1,000 bonus",
    category: "sales"
  },
  {
    id: "2",
    title: "Referral Program",
    description: "Earn $250 for each new sales rep you refer who stays for 90 days",
    endDate: "2023-12-31",
    progress: 2,
    goal: null, // unlimited
    reward: "$250 per referral",
    category: "referral"
  },
  {
    id: "3",
    title: "Utility Bill Champion",
    description: "Get the most utility bills uploaded in a month",
    endDate: "2023-07-31",
    progress: 15,
    goal: null, // competitive
    reward: "$500 bonus",
    category: "documentation"
  },
  {
    id: "4",
    title: "Perfect Attendance",
    description: "No missed appointments for 30 days",
    endDate: "2023-07-15",
    progress: 22,
    goal: 30,
    reward: "$350 bonus",
    category: "reliability"
  }
];

const completedIncentives = [
  {
    id: "5",
    title: "Spring Closer Challenge",
    description: "Close 8 sales in May",
    endDate: "2023-05-31", 
    achieved: true,
    reward: "$800 bonus",
    earnedDate: "2023-05-28",
    category: "sales"
  },
  {
    id: "6",
    title: "Team Player Award",
    description: "Help 5 team members close their first sale",
    endDate: "2023-06-15",
    achieved: true,
    reward: "$500 bonus",
    earnedDate: "2023-06-10",
    category: "teamwork"
  }
];

export default function IncentivesPage() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  
  const { user, loading, signOut } = useAuth();
  const router = useRouter();
  const { darkMode } = useTheme();

  // Redirect to home if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push("/");
    }
  }, [user, loading, router]);

  // Filter incentives based on category and search
  const filteredCurrentIncentives = currentIncentives.filter(incentive => {
    const matchesCategory = selectedCategory === "all" || incentive.category === selectedCategory;
    const matchesSearch = incentive.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         incentive.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const filteredCompletedIncentives = completedIncentives.filter(incentive => {
    const matchesCategory = selectedCategory === "all" || incentive.category === selectedCategory;
    const matchesSearch = incentive.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         incentive.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Calculate total potential earnings
  const potentialEarnings = currentIncentives.reduce((total, incentive) => {
    // Simple calculation - in a real app this would be more complex
    if (incentive.reward.includes("$")) {
      const value = parseInt(incentive.reward.replace(/[^0-9]/g, ''));
      return total + value;
    }
    return total;
  }, 0);
  
  // Calculate earned rewards
  const earnedRewards = completedIncentives.reduce((total, incentive) => {
    if (incentive.reward.includes("$")) {
      const value = parseInt(incentive.reward.replace(/[^0-9]/g, ''));
      return total + value;
    }
    return total;
  }, 0);

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

        {/* Main content */}
        <main className="p-6">
          <div className="max-w-6xl mx-auto">
            {/* Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {/* Available Incentives Card */}
              <div className="theme-bg-tertiary rounded-lg shadow p-6 border theme-border-primary">
                <div className="flex items-center mb-3">
                  <div className={`p-3 rounded-full ${darkMode ? 'bg-amber-500 bg-opacity-10' : 'bg-blue-500 bg-opacity-10'}`}>
                    <Gift className={`h-6 w-6 ${darkMode ? 'text-amber-500' : 'text-blue-500'}`} />
                  </div>
                  <div className="ml-4">
                    <h3 className="theme-text-secondary text-sm">Available Incentives</h3>
                    <p className="text-2xl font-semibold theme-text-primary">{currentIncentives.length}</p>
                  </div>
                </div>
                <div className="pt-3 border-t theme-border-primary">
                  <span className="text-sm theme-text-secondary">
                    Opportunities to earn rewards
                  </span>
                </div>
              </div>
              
              {/* Potential Earnings Card */}
              <div className="theme-bg-tertiary rounded-lg shadow p-6 border theme-border-primary">
                <div className="flex items-center mb-3">
                  <div className={`p-3 rounded-full ${darkMode ? 'bg-amber-500 bg-opacity-10' : 'bg-blue-500 bg-opacity-10'}`}>
                    <TrendingUp className={`h-6 w-6 ${darkMode ? 'text-amber-500' : 'text-blue-500'}`} />
                  </div>
                  <div className="ml-4">
                    <h3 className="theme-text-secondary text-sm">Potential Earnings</h3>
                    <p className="text-2xl font-semibold theme-text-primary">${potentialEarnings.toLocaleString()}</p>
                  </div>
                </div>
                <div className="pt-3 border-t theme-border-primary">
                  <span className="text-sm theme-text-secondary">
                    Total rewards available to earn
                  </span>
                </div>
              </div>
              
              {/* Earned Rewards Card */}
              <div className="theme-bg-tertiary rounded-lg shadow p-6 border theme-border-primary">
                <div className="flex items-center mb-3">
                  <div className={`p-3 rounded-full ${darkMode ? 'bg-amber-500 bg-opacity-10' : 'bg-blue-500 bg-opacity-10'}`}>
                    <Award className={`h-6 w-6 ${darkMode ? 'text-amber-500' : 'text-blue-500'}`} />
                  </div>
                  <div className="ml-4">
                    <h3 className="theme-text-secondary text-sm">Earned Rewards</h3>
                    <p className="text-2xl font-semibold theme-text-primary">${earnedRewards.toLocaleString()}</p>
                  </div>
                </div>
                <div className="pt-3 border-t theme-border-primary">
                  <span className="text-sm theme-text-secondary">
                    Total rewards earned this year
                  </span>
                </div>
              </div>
            </div>
            
            {/* Filters and Search */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <Search className="h-5 w-5 theme-text-secondary" />
                </div>
                <input
                  type="text"
                  className="theme-bg-tertiary theme-border-primary border pl-10 pr-4 py-2 rounded-lg w-full theme-text-primary focus:outline-none focus:ring-2 focus:theme-ring-primary"
                  placeholder="Search incentives..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="flex items-center gap-2">
                <Filter className="h-5 w-5 theme-text-secondary" />
                <select
                  className="theme-bg-tertiary theme-border-primary border px-3 py-2 rounded-lg theme-text-primary"
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                >
                  <option value="all">All Categories</option>
                  <option value="sales">Sales</option>
                  <option value="referral">Referrals</option>
                  <option value="documentation">Documentation</option>
                  <option value="reliability">Reliability</option>
                  <option value="teamwork">Teamwork</option>
                </select>
              </div>
            </div>
            
            {/* Active Incentives */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold theme-text-primary mb-4">Active Incentives</h2>
              
              {filteredCurrentIncentives.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {filteredCurrentIncentives.map(incentive => (
                    <div key={incentive.id} className="theme-bg-tertiary border theme-border-primary rounded-lg overflow-hidden">
                      <div className="p-6">
                        <div className="flex justify-between items-start">
                          <h3 className="text-lg font-semibold theme-text-primary">{incentive.title}</h3>
                          <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                            incentive.category === 'sales' ? (darkMode ? 'bg-amber-500 bg-opacity-10 text-amber-500' : 'bg-blue-500 bg-opacity-10 text-blue-500') :
                            incentive.category === 'referral' ? 'bg-green-500 bg-opacity-10 text-green-500' :
                            incentive.category === 'documentation' ? 'bg-purple-500 bg-opacity-10 text-purple-500' :
                            incentive.category === 'reliability' ? 'bg-teal-500 bg-opacity-10 text-teal-500' :
                            'bg-gray-500 bg-opacity-10 text-gray-500'
                          }`}>
                            {incentive.category.charAt(0).toUpperCase() + incentive.category.slice(1)}
                          </div>
                        </div>
                        
                        <p className="mt-2 theme-text-secondary">{incentive.description}</p>
                        
                        <div className="mt-4 flex items-center">
                          <Calendar className="h-4 w-4 theme-text-secondary mr-2" />
                          <span className="text-sm theme-text-secondary">Ends on {new Date(incentive.endDate).toLocaleDateString()}</span>
                        </div>
                        
                        <div className="mt-4">
                          <div className="flex justify-between text-sm mb-1">
                            <span className="theme-text-primary font-medium">Progress</span>
                            {incentive.goal ? (
                              <span className="theme-text-primary">{incentive.progress} / {incentive.goal}</span>
                            ) : (
                              <span className="theme-text-primary">{incentive.progress} completed</span>
                            )}
                          </div>
                          {incentive.goal && (
                            <div className="w-full h-2 theme-bg-quaternary rounded-full">
                              <div 
                                className={`h-full rounded-full ${darkMode ? 'bg-amber-500' : 'bg-blue-500'}`} 
                                style={{ width: `${Math.min(100, (incentive.progress / incentive.goal) * 100)}%` }}
                              ></div>
                            </div>
                          )}
                        </div>
                        
                        <div className="mt-4 pt-4 border-t theme-border-primary flex items-center justify-between">
                          <div className="theme-text-primary font-medium">Reward: {incentive.reward}</div>
                          <button className={`flex items-center text-sm font-medium ${darkMode ? 'text-amber-500' : 'text-blue-500'}`}>
                            View Details
                            <ChevronRight className="h-4 w-4 ml-1" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="theme-bg-tertiary border theme-border-primary rounded-lg p-8 text-center">
                  <Zap className="h-12 w-12 mx-auto mb-4 theme-text-secondary opacity-50" />
                  <h3 className="text-lg font-medium theme-text-primary mb-2">No active incentives found</h3>
                  <p className="theme-text-secondary">Check back later for new incentive programs or adjust your filters.</p>
                </div>
              )}
            </div>
            
            {/* Completed Incentives */}
            <div>
              <h2 className="text-xl font-semibold theme-text-primary mb-4">Completed Incentives</h2>
              
              {filteredCompletedIncentives.length > 0 ? (
                <div className="theme-bg-tertiary border theme-border-primary rounded-lg overflow-hidden">
                  {filteredCompletedIncentives.map((incentive, index) => (
                    <div 
                      key={incentive.id}
                      className={`p-6 flex items-center justify-between ${
                        index !== filteredCompletedIncentives.length - 1 ? 'border-b theme-border-primary' : ''
                      }`}
                    >
                      <div className="flex items-start">
                        <div className={`p-2 rounded-full mr-4 ${darkMode ? 'bg-amber-500 bg-opacity-10' : 'bg-blue-500 bg-opacity-10'}`}>
                          <CheckCircle2 className={`h-5 w-5 ${darkMode ? 'text-amber-500' : 'text-blue-500'}`} />
                        </div>
                        <div>
                          <h3 className="font-medium theme-text-primary">{incentive.title}</h3>
                          <p className="text-sm theme-text-secondary mt-1">{incentive.description}</p>
                          <div className="flex items-center mt-2">
                            <span className="text-xs theme-text-tertiary">Completed on {new Date(incentive.earnedDate).toLocaleDateString()}</span>
                            <span className={`ml-3 px-2 py-0.5 rounded-full text-xs ${
                              incentive.category === 'sales' ? (darkMode ? 'bg-amber-500 bg-opacity-10 text-amber-500' : 'bg-blue-500 bg-opacity-10 text-blue-500') :
                              incentive.category === 'referral' ? 'bg-green-500 bg-opacity-10 text-green-500' :
                              incentive.category === 'documentation' ? 'bg-purple-500 bg-opacity-10 text-purple-500' :
                              incentive.category === 'reliability' ? 'bg-teal-500 bg-opacity-10 text-teal-500' :
                              'bg-gray-500 bg-opacity-10 text-gray-500'
                            }`}>
                              {incentive.category.charAt(0).toUpperCase() + incentive.category.slice(1)}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium theme-text-primary">{incentive.reward}</div>
                        <button className={`text-sm ${darkMode ? 'text-amber-500' : 'text-blue-500'} mt-2 flex items-center justify-end w-full`}>
                          Details
                          <ChevronRight className="h-4 w-4 ml-1" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="theme-bg-tertiary border theme-border-primary rounded-lg p-8 text-center">
                  <Award className="h-12 w-12 mx-auto mb-4 theme-text-secondary opacity-50" />
                  <h3 className="text-lg font-medium theme-text-primary mb-2">No completed incentives found</h3>
                  <p className="theme-text-secondary">You haven't completed any incentives matching your filters yet.</p>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
} 
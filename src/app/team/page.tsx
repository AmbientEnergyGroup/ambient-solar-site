"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/contexts/AuthContext";
import { Users, LogOut, Home, Search, Plus, Filter, MapPin } from "lucide-react";
import AmbientLogo from "@/components/AmbientLogo";
import Sidebar from "@/components/Sidebar";
import { useTheme } from "@/lib/hooks/useTheme";
import ClientOnly from "@/components/ClientOnly";
import MessagesButton from "@/components/MessagesButton";
import OfficeLogos from "@/components/OfficeLogos";

export default function Team() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isClient, setIsClient] = useState(false);
  const [userOffice, setUserOffice] = useState("Fresno"); // Default office
  const [lancasterTeamSize, setLancasterTeamSize] = useState(0);
  const [teamGoalKW, setTeamGoalKW] = useState(0);
  const WEEKLY_GOAL_KW = 200;
  const { darkMode } = useTheme();
  
  const { user, loading, signOut } = useAuth();
  const router = useRouter();

  // Add a new useEffect for client-side initialization
  useEffect(() => {
    setIsClient(true);
  }, []);

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

  // Redirect to home if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push("/");
    }
  }, [user, loading, router]);

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
              {/* Removed search bar */}
              <div className="flex items-center gap-2">
                {/* Removed Filter button */}
                <button className={`px-4 py-2 ${darkMode ? 'bg-amber-500 hover:bg-amber-600' : 'bg-blue-500 hover:bg-blue-600'} text-white rounded-lg font-medium transition-colors duration-200 flex items-center`}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Member
                </button>
              </div>
            </div>
            
            {/* Office-specific overview cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="theme-bg-tertiary p-6 rounded-lg shadow-sm border theme-border-primary">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm theme-text-secondary">Lancaster California</p>
                    <p className="text-2xl font-bold theme-text-primary">{lancasterTeamSize}</p>
                  </div>
                  <div className={`p-3 rounded-full border-2 border-black ${darkMode ? 'bg-amber-500 bg-opacity-20' : 'bg-blue-500 bg-opacity-20'}`}> {/* Black border for Lancaster */}
                    <OfficeLogos office="Lancaster" size={48} />
                  </div>
                </div>
              </div>
              
              <div className="theme-bg-tertiary p-6 rounded-lg shadow-md border theme-border-primary">
                <div className="flex items-center justify-between">
                  <div className="w-full pr-4">
                    <p className="text-sm font-semibold text-gray-300 mb-1 tracking-wide uppercase">Team Goal</p>
                    <p className="text-3xl font-extrabold text-white mb-2">{teamGoalKW} <span className="text-lg font-medium text-gray-400">/ {WEEKLY_GOAL_KW} kW</span></p>
                    <div className="mb-1 flex justify-between items-end">
                      <span className="text-xs font-medium text-gray-400">This Week</span>
                      <span className="text-xs font-medium text-gray-400">{Math.round((teamGoalKW / WEEKLY_GOAL_KW) * 100)}%</span>
                    </div>
                    <div className="w-full h-7 bg-black rounded-xl shadow-inner overflow-hidden relative">
                      <div
                        className="h-7 rounded-xl transition-all duration-300"
                        style={{
                          width: `${Math.min((teamGoalKW / WEEKLY_GOAL_KW) * 100, 100)}%`,
                          background: '#F59E42', // Company orange
                          boxShadow: darkMode
                            ? '0 2px 8px 0 #F59E4280'
                            : '0 2px 8px 0 #F59E4280',
                        }}
                      ></div>
                      {/* Animated marker for current progress */}
                      {(() => {
                        const percent = Math.min((teamGoalKW / WEEKLY_GOAL_KW) * 100, 100);
                        // Marker width is 24px (w-6), bar is 100% width
                        // To keep it flush at 0% and 100%, use calc with translation
                        let markerLeft = `calc(${percent}% - 12px)`;
                        if (percent <= 0) markerLeft = '0px';
                        if (percent >= 100) markerLeft = 'calc(100% - 24px)';
                        return (
                          <div
                            className="absolute top-0 flex flex-col items-center"
                            style={{ left: markerLeft }}
                          >
                            <div className={`w-6 h-6 rounded-full border-2 ${darkMode ? 'border-amber-500 bg-amber-400' : 'border-orange-400 bg-orange-300'} shadow-lg flex items-center justify-center`}>
                              <svg width="14" height="14" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="7" fill="#fff"/></svg>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                  <div className={`p-4 rounded-full ${darkMode ? 'bg-green-500 bg-opacity-20' : 'bg-green-500 bg-opacity-20'} shadow-lg ml-4 flex-shrink-0`}>
                    <svg xmlns="http://www.w3.org/2000/svg" className={`h-10 w-10 ${darkMode ? 'text-green-500' : 'text-green-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
              </div>
              
              <div className="theme-bg-tertiary p-6 rounded-lg shadow-sm border theme-border-primary">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm theme-text-secondary">{userOffice} Monthly Revenue</p>
                    <p className="text-2xl font-bold theme-text-primary">$156K</p>
                  </div>
                  <div className={`p-3 rounded-full ${darkMode ? 'bg-purple-500 bg-opacity-20' : 'bg-purple-500 bg-opacity-20'}`}>
                    <svg xmlns="http://www.w3.org/2000/svg" className={`h-6 w-6 ${darkMode ? 'text-purple-500' : 'text-purple-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Team members table */}
            <div className="theme-bg-tertiary rounded-lg shadow overflow-hidden">
              <div className="px-6 py-4 border-b theme-border-primary">
                <h2 className="text-lg font-semibold theme-text-primary">Team Members</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="border-b theme-border-primary text-left theme-bg-tertiary">
                      <th className="px-6 py-3 text-xs font-medium theme-text-secondary uppercase tracking-wider">
                        Member
                      </th>
                      <th className="px-6 py-3 text-xs font-medium theme-text-secondary uppercase tracking-wider">
                        Role
                      </th>
                      <th className="px-6 py-3 text-xs font-medium theme-text-secondary uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-xs font-medium theme-text-secondary uppercase tracking-wider">
                        Performance
                      </th>
                      <th className="px-6 py-3 text-xs font-medium theme-text-secondary uppercase tracking-wider text-right">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y theme-border-secondary">
                    <tr className="hover:theme-bg-quaternary">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                            <span className="text-sm font-medium text-gray-700">JD</span>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium theme-text-primary">John Doe</div>
                            <div className="text-sm theme-text-secondary">john.doe@example.com</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-purple-100 text-purple-800">
                          Manager
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                          Active
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm theme-text-primary">
                        <div className="flex items-center">
                          <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                            <div className="bg-green-500 h-2 rounded-full" style={{ width: '85%' }}></div>
                          </div>
                          <span>85%</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button className="text-blue-600 hover:text-blue-900 mr-3">Edit</button>
                        <button className="text-red-600 hover:text-red-900">Remove</button>
                      </td>
                    </tr>
                    <tr className="hover:theme-bg-quaternary">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                            <span className="text-sm font-medium text-gray-700">SJ</span>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium theme-text-primary">Sarah Johnson</div>
                            <div className="text-sm theme-text-secondary">sarah.j@example.com</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                          Sales Rep
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                          Active
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm theme-text-primary">
                        <div className="flex items-center">
                          <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                            <div className="bg-blue-500 h-2 rounded-full" style={{ width: '72%' }}></div>
                          </div>
                          <span>72%</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button className="text-blue-600 hover:text-blue-900 mr-3">Edit</button>
                        <button className="text-red-600 hover:text-red-900">Remove</button>
                      </td>
                    </tr>
                    <tr className="hover:theme-bg-quaternary">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                            <span className="text-sm font-medium text-gray-700">MW</span>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium theme-text-primary">Mike Wilson</div>
                            <div className="text-sm theme-text-secondary">mike.w@example.com</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                          Sales Rep
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                          Pending
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm theme-text-primary">
                        <div className="flex items-center">
                          <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                            <div className="bg-yellow-500 h-2 rounded-full" style={{ width: '45%' }}></div>
                          </div>
                          <span>45%</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button className="text-blue-600 hover:text-blue-900 mr-3">Edit</button>
                        <button className="text-red-600 hover:text-red-900">Remove</button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </main>
        </div>
      </div>
    </ClientOnly>
  );
} 
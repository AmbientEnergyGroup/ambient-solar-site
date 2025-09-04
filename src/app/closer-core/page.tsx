"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/lib/contexts/AuthContext";
import { useTheme } from "@/lib/hooks/useTheme";
import { Zap, Check, X, Clock, User, MapPin, Phone, Mail } from "lucide-react";
import AmbientLogo from "@/components/AmbientLogo";
import Sidebar from "@/components/Sidebar";
import MessagesButton from "@/components/MessagesButton";
import ClientOnly from "@/components/ClientOnly";
import { 
  getAvailableSets, 
  getCloserSets, 
  subscribeToAvailableSets, 
  subscribeToCloserSets,
  assignSetToCloser,
  updateSetStatus,
  CustomerSet 
} from "@/lib/firebase/firebaseUtils";

// Use CustomerSet from firebaseUtils, extending it for closer-specific data
interface CloserSet extends CustomerSet {
  setterName?: string; // Name of the setter
}

export default function CloserCore() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<'available' | 'assigned' | 'closed'>('available');
  const [sets, setSets] = useState<CloserSet[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOffice, setSelectedOffice] = useState<string>('all');
  const [lastFetchTime, setLastFetchTime] = useState<number>(0);
  const { darkMode } = useTheme();
  const auth = useAuth();
  const { user, userData, loading: authLoading, signOut } = auth || {};

  // Check if user is a closer (only closers can access this page)
  const isCloser = user?.role === 'closer' || userData?.role === 'closer' || user?.role === 'admin';
  const isSetter = user?.role === 'setter' || userData?.role === 'setter';
  const canInteract = isCloser; // Only closers can interact, setters can only view
  
  // Redirect setters away from this page
  useEffect(() => {
    if (!authLoading && user && isSetter && !isCloser) {
      // Redirect setters to dashboard since they don't have access
      window.location.href = '/dashboard';
    }
  }, [authLoading, user, isSetter, isCloser]);

    // Set up real-time subscriptions to Firestore
  useEffect(() => {
    if (!user?.uid) {
      setLoading(false);
      return;
    }

    // Check if we need to fetch data (cache for 30 seconds)
    const now = Date.now();
    const shouldFetch = now - lastFetchTime > 30000; // 30 second cache

    if (!shouldFetch && sets.length > 0) {
      setLoading(false);
      return;
    }

    console.log('Setting up real-time subscriptions for closer:', user.uid);
    
    let unsubscribe: (() => void) | null = null;

    // Set a timeout to prevent infinite loading
    const loadingTimeout = setTimeout(() => {
      console.log('Loading timeout reached, setting loading to false');
      setLoading(false);
    }, 5000); // Reduced to 5 second timeout

    try {
      if (activeTab === 'available') {
        unsubscribe = subscribeToAvailableSets((availableSets) => {
          console.log('Received available sets from Firestore:', availableSets.length);
          const closerSets: CloserSet[] = availableSets.map(set => ({
            ...set,
            setterName: `Setter ${set.userId?.slice(-4) || 'Unknown'}`,
            office: userData?.office || 'Unknown'
          }));
          setSets(closerSets);
          setLastFetchTime(now);
          setLoading(false);
          clearTimeout(loadingTimeout);
        });
      } else if (activeTab === 'assigned') {
        unsubscribe = subscribeToCloserSets(user.uid, (assignedSets) => {
          console.log('Received assigned sets from Firestore:', assignedSets.length);
          const closerSets: CloserSet[] = assignedSets.map(set => ({
            ...set,
            setterName: `Setter ${set.userId?.slice(-4) || 'Unknown'}`,
            office: userData?.office || 'Unknown'
          }));
          setSets(closerSets);
          setLastFetchTime(now);
          setLoading(false);
          clearTimeout(loadingTimeout);
        });
      } else if (activeTab === 'closed') {
        // For closed sets, we can use a simpler approach or cache the data
        setSets([]);
        setLastFetchTime(now);
        setLoading(false);
        clearTimeout(loadingTimeout);
      }
    } catch (error) {
      console.error('Error setting up subscription:', error);
      setLoading(false);
      clearTimeout(loadingTimeout);
    }

    return () => {
      clearTimeout(loadingTimeout);
      if (unsubscribe) unsubscribe();
    };
  }, [user?.uid, activeTab, lastFetchTime, sets.length]); // Added cache dependencies

  // Reset loading when tab changes
  useEffect(() => {
    setLoading(true);
  }, [activeTab]);

  // Function to format date header
  const formatDateHeader = (dateString: string) => {
    const date = new Date(dateString);
    const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'long' });
    const month = date.toLocaleDateString('en-US', { month: 'long' });
    const day = date.getDate();
    const year = date.getFullYear();
    return `${dayOfWeek}, ${month} ${day}, ${year}`;
  };

  // Filter sets based on active tab and office - memoized for performance
  const filteredSets = useMemo(() => {
    let filtered = sets;

    // Filter by office
    if (selectedOffice !== 'all' && user?.role !== 'admin') {
      filtered = filtered.filter(set => set.office === selectedOffice);
    } else if (selectedOffice !== 'all') {
      filtered = filtered.filter(set => set.office === selectedOffice);
    }

    // Filter by status
    switch (activeTab) {
      case 'available':
        return filtered.filter(set => set.status === 'active' && !set.closerId);
      case 'assigned':
        return filtered.filter(set => set.closerId === user?.uid);
      case 'closed':
        return filtered.filter(set => set.status === 'closed');
      default:
        return filtered;
    }
  }, [sets, selectedOffice, activeTab, user?.uid, user?.role]);

  // Group sets by date - memoized for performance
  const { grouped, sortedDates } = useMemo(() => {
    const grouped: Record<string, CloserSet[]> = {};
    
    filteredSets.forEach(set => {
      const date = set.appointmentDate;
      if (!grouped[date]) {
        grouped[date] = [];
      }
      grouped[date].push(set);
    });

    // Sort dates
    const sortedDates = Object.keys(grouped).sort((a, b) => {
      if (activeTab === 'available') {
        return new Date(a).getTime() - new Date(b).getTime(); // Upcoming first
      } else {
        return new Date(b).getTime() - new Date(a).getTime(); // Recent first
      }
    });

    return { grouped, sortedDates };
  }, [filteredSets, activeTab]);

  // Memoized stats calculations
  const availableSetsCount = useMemo(() => 
    sets.filter(set => set.status === 'active' && !set.closerId).length, 
    [sets]
  );

  const myAssignmentsCount = useMemo(() => 
    sets.filter(set => set.closerId === user?.uid).length, 
    [sets, user?.uid]
  );

  const closedSetsCount = useMemo(() => 
    sets.filter(set => set.status === 'closed' && set.closerId === user?.uid).length, 
    [sets, user?.uid]
  );

  // Handle accepting a set
  const handleAcceptSet = async (setId: string) => {
    if (!user?.uid) return;
    
    try {
      const closerName = user?.displayName || userData?.displayName || 'Unknown Closer';
      // First assign the set to the closer
      await assignSetToCloser(setId, user.uid, closerName);
      // Then update status to assigned
      await updateSetStatus(setId, 'assigned');
      console.log('Set accepted and assigned successfully');
    } catch (error) {
      console.error('Error accepting set:', error);
      alert('Error accepting set. Please try again.');
    }
  };

    // Handle marking set as closed
  const handleCloseSet = async (setId: string) => {
    try {
      await updateSetStatus(setId, 'closed');
      console.log('Set marked as closed');
    } catch (error) {
      console.error('Error closing set:', error);
      alert('Error closing set. Please try again.');
    }
  };

  // Handle marking set as not closed
  const handleNotClosedSet = async (setId: string) => {
    try {
      await updateSetStatus(setId, 'not_closed');
      console.log('Set marked as not closed');
    } catch (error) {
      console.error('Error marking set as not closed:', error);
      alert('Error marking set as not closed. Please try again.');
    }
  };

  // Show loading state while checking authentication
  if (authLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen theme-bg-primary">
        <div className={`animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 ${darkMode ? 'border-cyan-500' : 'border-cyan-500'} mb-4`}></div>
        <div className="text-gray-400 text-sm">Loading authentication...</div>
      </div>
    );
  }

  // Show loading state for sets
  if (loading) {
    return (
      <ClientOnly>
        <div className="flex h-screen theme-bg-primary">
          <Sidebar 
            darkMode={darkMode}
            signOut={signOut}
            sidebarOpen={sidebarOpen}
            setSidebarOpen={setSidebarOpen}
          />
          <div className={`flex-1 overflow-auto theme-bg-secondary transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-0'}`}>
            <header className="standard-header">
              <div className="standard-header-content">
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
                <div className="ml-2">
                  <MessagesButton />
                </div>
                {!sidebarOpen && (
                  <div className="header-logo-center">
                    <AmbientLogo theme={darkMode ? 'dark' : 'light'} size="xl" />
                  </div>
                )}
              </div>
            </header>
            <main className="p-6">
              <div className="flex flex-col items-center justify-center min-h-96">
                <div className={`animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 ${darkMode ? 'border-cyan-500' : 'border-cyan-500'} mb-4`}></div>
                <div className="text-gray-400 text-sm">Loading sets...</div>
              </div>
            </main>
          </div>
        </div>
      </ClientOnly>
    );
  }

  // If user is not authenticated and not loading, this will render briefly before redirect
  if (!user) {
    return null;
  }

  // If user is not a closer or setter, show access denied
  if (!isCloser && !isSetter) {
    return (
      <ClientOnly>
        <div className="flex h-screen theme-bg-primary">
          <Sidebar 
            darkMode={darkMode}
            signOut={signOut}
            sidebarOpen={sidebarOpen}
            setSidebarOpen={setSidebarOpen}
          />
          <div className={`flex-1 overflow-auto theme-bg-secondary transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-0'}`}>
            <header className="standard-header">
              <div className="standard-header-content">
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
                <div className="ml-2">
                  <MessagesButton />
                </div>
                {!sidebarOpen && (
                  <div className="header-logo-center">
                    <AmbientLogo theme={darkMode ? 'dark' : 'light'} size="xl" />
                  </div>
                )}
              </div>
            </header>
            <main className="p-6">
              <div className="text-center">
                <X className="h-16 w-16 text-red-500 mx-auto mb-4" />
                <h1 className="text-2xl font-bold theme-text-primary mb-2">Access Denied</h1>
                <p className="text-lg theme-text-secondary">
                  Only closers and setters can access this page. Your current role is: <strong>{user?.role || userData?.role}</strong>
                </p>
              </div>
            </main>
          </div>
        </div>
      </ClientOnly>
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
        <div className={`flex-1 overflow-auto theme-bg-secondary transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-0'}`}>
          {/* Header */}
          <header className="standard-header">
            <div className="standard-header-content">
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
          </header>

          {/* Closer Core content */}
          <main className="p-6">
            {/* Hero Section */}
            <div className="text-center mb-8">
              <div className="flex items-center justify-center mb-4">
                <Zap className="h-12 w-12 text-cyan-500 mr-3" />
                <h1 className="text-4xl font-bold theme-text-primary">Closer Core</h1>
              </div>
              <p className="text-lg theme-text-secondary max-w-2xl mx-auto">
                Centralized hub for closers to view and accept sets from all setters. Accept appointments, track your assignments, and manage your closing pipeline.
              </p>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                <div className="flex items-center">
                  <Clock className="h-8 w-8 text-blue-500 mr-3" />
                  <div>
                    <p className="text-sm font-medium theme-text-secondary">Available Sets</p>
                    <p className="text-2xl font-bold theme-text-primary">
                      {availableSetsCount}
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                <div className="flex items-center">
                  <User className="h-8 w-8 text-green-500 mr-3" />
                  <div>
                    <p className="text-sm font-medium theme-text-secondary">My Assignments</p>
                    <p className="text-2xl font-bold theme-text-primary">
                      {myAssignmentsCount}
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                <div className="flex items-center">
                  <Check className="h-8 w-8 text-purple-500 mr-3" />
                  <div>
                    <p className="text-sm font-medium theme-text-secondary">Closed This Week</p>
                    <p className="text-2xl font-bold theme-text-primary">
                      {closedSetsCount}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Setter View-Only Notice */}
            {isSetter && !isCloser && (
              <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200">
                      View-Only Mode
                    </h3>
                    <div className="mt-2 text-sm text-blue-700 dark:text-blue-300">
                      <p>As a setter, you can view sets and their status updates, but cannot interact with them. Only closers can accept and manage sets.</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Office Sets Overview */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-semibold theme-text-primary">
                  Sets {user?.role === 'admin' ? '(All Offices)' : `(${userData?.office || 'Your Office'} Office)`}
                </h2>
                <div className="flex items-center space-x-2">
                  {user?.role === 'admin' && (
                    <select 
                      value={selectedOffice}
                      onChange={(e) => setSelectedOffice(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-md theme-bg-tertiary theme-text-primary"
                    >
                      <option value="all">All Offices</option>
                      <option value="Fresno">Fresno</option>
                      <option value="Lancaster">Lancaster</option>
                      <option value="Bakersfield">Bakersfield</option>
                    </select>
                  )}

                </div>
              </div>

              {/* Tab Navigation */}
              <div className="border-b theme-border-primary mb-4">
                <nav className="-mb-px flex space-x-8">
                  <button
                    onClick={() => setActiveTab('available')}
                    className={`py-2 px-1 border-b-2 font-medium text-sm ${
                      activeTab === 'available'
                        ? 'theme-border-primary theme-text-primary'
                        : 'border-transparent theme-text-secondary hover:theme-text-primary hover:border-gray-300'
                    }`}
                  >
                    Available Sets ({availableSetsCount})
                  </button>
                  <button
                    onClick={() => setActiveTab('assigned')}
                    className={`py-2 px-1 border-b-2 font-medium text-sm ${
                      activeTab === 'assigned'
                        ? 'theme-border-primary theme-text-primary'
                        : 'border-transparent theme-text-secondary hover:theme-text-primary hover:border-gray-300'
                    }`}
                  >
                    My Assignments ({myAssignmentsCount})
                  </button>
                  <button
                    onClick={() => setActiveTab('closed')}
                    className={`py-2 px-1 border-b-2 font-medium text-sm ${
                      activeTab === 'closed'
                        ? 'theme-border-primary theme-text-primary'
                        : 'border-transparent theme-text-secondary hover:theme-text-primary hover:border-gray-300'
                    }`}
                  >
                    Closed Sets ({closedSetsCount})
                  </button>
                </nav>
              </div>

              {user?.role !== 'admin' && (
                <div className="px-6 py-3 bg-blue-50 dark:bg-blue-900/20 border-b theme-border-primary">
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    📍 Showing sets from your assigned office: <strong>{userData?.office || 'Your Office'}</strong>
                  </p>
                  <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                    Sets are automatically assigned based on your office location. Contact admin to change offices.
                  </p>
                </div>
              )}

              {/* Sets Table with Scroll */}
              <div className="max-h-96 overflow-y-auto">
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead className="sticky top-0 z-10">
                      <tr className="border-b theme-border-primary theme-bg-tertiary">
                        <th className="px-6 py-3 text-xs font-medium theme-text-secondary uppercase tracking-wider text-left">
                          Customer
                        </th>
                        <th className="px-6 py-3 text-xs font-medium theme-text-secondary uppercase tracking-wider text-left">
                          Setter
                        </th>
                        <th className="px-6 py-3 text-xs font-medium theme-text-secondary uppercase tracking-wider text-left">
                          Office
                        </th>
                        <th className="px-6 py-3 text-xs font-medium theme-text-secondary uppercase tracking-wider text-left">
                          Appointment
                        </th>
                        <th className="px-6 py-3 text-xs font-medium theme-text-secondary uppercase tracking-wider text-left">
                          Spanish
                        </th>
                        <th className="px-6 py-3 text-xs font-medium theme-text-secondary uppercase tracking-wider text-left">
                          Status
                        </th>
                        <th className="px-6 py-3 text-xs font-medium theme-text-secondary uppercase tracking-wider text-right">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y theme-border-secondary">
                      {(() => {
                        if (sortedDates.length === 0) {
                          return (
                            <tr>
                              <td colSpan={7} className="px-6 py-12 text-center">
                                <div className="text-gray-500">
                                  <p className="text-lg font-medium mb-2">
                                    {activeTab === 'available' ? 'No available sets' : 
                                     activeTab === 'assigned' ? 'No assigned sets' : 
                                     'No closed sets'}
                                  </p>
                                  <p className="text-sm">
                                    {activeTab === 'available' ? 'New sets will appear here when setters create appointments' :
                                     activeTab === 'assigned' ? 'Accepted sets will appear here' :
                                     'Closed sets will appear here'}
                                  </p>
                                </div>
                              </td>
                            </tr>
                          );
                        }

                        return sortedDates.map((date) => {
                          const setsForDate = grouped[date];
                          
                          return (
                            <React.Fragment key={date}>
                              {/* Date Header */}
                              <tr className="theme-bg-quaternary">
                                <td colSpan={7} className="px-6 py-3">
                                  <h3 className="text-lg font-semibold theme-text-primary">
                                    {formatDateHeader(date)}
                                  </h3>
                                </td>
                              </tr>
                              
                              {/* Sets for this date */}
                              {setsForDate.map((set) => (
                                <tr key={set.id} className="hover:theme-bg-quaternary">
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center">
                                      <div>
                                        <div className="text-sm font-medium theme-text-primary">{set.customerName}</div>
                                        <div className="text-xs theme-text-secondary flex items-center">
                                          <MapPin className="h-3 w-3 mr-1" />
                                          {set.address}
                                        </div>
                                        <div className="text-xs theme-text-secondary flex items-center">
                                          <Phone className="h-3 w-3 mr-1" />
                                          {set.phoneNumber}
                                        </div>
                                        {set.email && (
                                          <div className="text-xs theme-text-secondary flex items-center">
                                            <Mail className="h-3 w-3 mr-1" />
                                            {set.email}
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm theme-text-primary">{set.setterName}</div>
                                    <div className="text-xs theme-text-secondary">Setter</div>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                      set.office === 'Fresno' ? 'bg-blue-100 text-blue-800' :
                                      set.office === 'Lancaster' ? 'bg-purple-100 text-purple-800' :
                                      'bg-green-100 text-green-800'
                                    }`}>
                                      {set.office}
                                    </span>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm theme-text-primary">{set.appointmentDate}</div>
                                    <div className="text-xs theme-text-secondary">{set.appointmentTime}</div>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                      set.isSpanishSpeaker ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                                    }`}>
                                      {set.isSpanishSpeaker ? 'Yes' : 'No'}
                                    </span>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                      set.status === 'active' ? 'bg-green-100 text-green-800' :
                                      set.status === 'assigned' ? 'bg-blue-100 text-blue-800' :
                                      set.status === 'closed' ? 'bg-purple-100 text-purple-800' :
                                      'bg-yellow-100 text-yellow-800'
                                    }`}>
                                      {set.status === 'active' ? 'Available' :
                                       set.status === 'assigned' ? 'Assigned' :
                                       set.status === 'closed' ? 'Closed' : 'Not Closed'}
                                    </span>
                                    {set.closerName && (
                                      <div className="text-xs theme-text-secondary mt-1">
                                        Assigned to: {set.closerName}
                                      </div>
                                    )}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <div className="flex space-x-2 justify-end">
                                      {activeTab === 'available' && (
                                        <button 
                                          onClick={() => canInteract && handleAcceptSet(set.id)}
                                          disabled={!canInteract}
                                          className={`px-3 py-1 rounded text-xs flex items-center ${
                                            canInteract 
                                              ? 'bg-green-500 hover:bg-green-600 text-white' 
                                              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                          }`}
                                        >
                                          <Check className="h-3 w-3 mr-1" />
                                          Accept
                                        </button>
                                      )}
                                      {activeTab === 'assigned' && (
                                        <>
                                          <button 
                                            disabled={!canInteract}
                                            className={`px-2.5 py-1 rounded text-xs ${
                                              canInteract 
                                                ? 'bg-gray-200 text-gray-700 hover:bg-gray-300' 
                                                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                            }`}
                                          >
                                            Documents
                                          </button>
                                          <button 
                                            onClick={() => canInteract && handleCloseSet(set.id)}
                                            disabled={!canInteract}
                                            className={`px-2.5 py-1 rounded text-xs ${
                                              canInteract 
                                                ? 'bg-green-500 hover:bg-green-600 text-white' 
                                                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                            }`}
                                          >
                                            Mark Closed
                                          </button>
                                          <button 
                                            onClick={() => canInteract && handleNotClosedSet(set.id)}
                                            disabled={!canInteract}
                                            className={`px-2.5 py-1 rounded text-xs ${
                                              canInteract 
                                                ? 'bg-yellow-500 hover:bg-yellow-600 text-white' 
                                                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                            }`}
                                          >
                                            Mark Not Closed
                                          </button>
                                        </>
                                      )}
                                      {activeTab === 'closed' && (
                                        <>
                                          <button 
                                            disabled={!canInteract}
                                            className={`px-2.5 py-1 rounded text-xs ${
                                              canInteract 
                                                ? 'bg-gray-200 text-gray-700 hover:bg-gray-300' 
                                                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                            }`}
                                          >
                                            View Details
                                          </button>
                                          <button 
                                            disabled={!canInteract}
                                            className={`px-2.5 py-1 rounded text-xs ${
                                              canInteract 
                                                ? 'bg-blue-500 hover:bg-blue-600 text-white' 
                                                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                            }`}
                                          >
                                            Move to Projects
                                          </button>
                                        </>
                                      )}
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </React.Fragment>
                          );
                        });
                      })()}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </ClientOnly>
  );
}

"use client";

import { useState } from "react";
import { useAuth } from "@/lib/contexts/AuthContext";
import { useTheme } from "@/lib/hooks/useTheme";
import { Menu } from "lucide-react";
import AmbientLogo from "@/components/AmbientLogo";
import MessagesButton from "@/components/MessagesButton";
import Sidebar from "@/components/Sidebar";
import UserProfile from '../../components/UserProfile';
import AuthDiagnostic from '../../components/AuthDiagnostic';

export default function AccountPage() {
  const auth = useAuth();
  const { user, loading, signOut } = auth || {};
  const { darkMode } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [headerVisible, setHeaderVisible] = useState(true);

  // Show loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen theme-bg-primary">
        <div className="text-center">
          <div className={`animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 ${darkMode ? 'border-cyan-500' : 'border-cyan-500'} mx-auto mb-4`}></div>
          <p className="text-gray-500">Loading account...</p>
        </div>
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
        {/* Header with toggle button */}
        <header className={`standard-header fixed top-0 z-50 transition-all duration-300 ${
          headerVisible ? 'translate-y-0' : '-translate-y-full'
        } ${sidebarOpen ? 'left-64 lg:left-64 left-0' : 'left-0'} right-0`}>
          <div className="standard-header-content">
            <button 
              onClick={() => setSidebarOpen(!sidebarOpen)} 
              className="text-cyan-500 hover:text-cyan-600 transition-colors p-1"
            >
              {sidebarOpen ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 sm:h-8 sm:w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M4 6h16M4 12h16M4 18h7" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 sm:h-8 sm:w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M4 6h16M4 12h16M4 18h16" />
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

        {/* Account content */}
        <main className="p-4 sm:p-6 pt-20 sm:pt-24">
          <UserProfile />
          <AuthDiagnostic />
        </main>
      </div>
    </div>
  );
} 
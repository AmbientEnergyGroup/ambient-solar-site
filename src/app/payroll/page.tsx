"use client";

import { useState } from "react";
import MessagesButton from "@/components/MessagesButton";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/contexts/AuthContext";
import { DollarSign, Users, Calendar, FileText } from "lucide-react";
import Sidebar from "@/components/Sidebar";
import { useTheme } from "@/lib/hooks/useTheme";

export default function PayrollPage() {
  const router = useRouter();
  const auth = useAuth();
  const { user, userData } = auth || {};
  const { darkMode, toggleDarkMode } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const handleSignOut = async () => {
    try {
      await auth?.signOut();
      router.push('/');
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
        <header className="bg-gray-900 border-b border-gray-600 px-6 py-4 flex-shrink-0">
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
                <div className="h-8 w-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
                  <DollarSign className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-white">Payroll</h1>
                  <p className="text-sm text-gray-400">Manage employee compensation and payments</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <MessagesButton />
              <button
                onClick={toggleDarkMode}
                className="p-2 rounded-lg bg-black hover:bg-gray-600 text-gray-300 transition-colors"
              >
                {darkMode ? '☀️' : '🌙'}
              </button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-auto p-6">
          {/* Coming Soon Section */}
          <div className="max-w-4xl mx-auto">
            <div className="text-center py-16">
              <div className="h-24 w-24 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <DollarSign className="h-12 w-12 text-green-400" />
              </div>
              <h2 className="text-3xl font-bold text-white mb-4">Payroll Management</h2>
              <p className="text-xl text-gray-400 mb-8">
                Comprehensive payroll system coming soon
              </p>
              
              {/* Feature Preview Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
                <div className="bg-gray-900 rounded-lg p-6 border border-gray-600">
                  <div className="h-12 w-12 bg-blue-500/20 rounded-lg flex items-center justify-center mb-4">
                    <Users className="h-6 w-6 text-blue-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">Employee Management</h3>
                  <p className="text-gray-400 text-sm">
                    Track employee information, roles, and compensation structures
                  </p>
                </div>
                
                <div className="bg-gray-900 rounded-lg p-6 border border-gray-600">
                  <div className="h-12 w-12 bg-purple-500/20 rounded-lg flex items-center justify-center mb-4">
                    <Calendar className="h-6 w-6 text-purple-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">Pay Periods</h3>
                  <p className="text-gray-400 text-sm">
                    Manage pay periods, schedules, and payment processing
                  </p>
                </div>
                
                <div className="bg-gray-900 rounded-lg p-6 border border-gray-600">
                  <div className="h-12 w-12 bg-orange-500/20 rounded-lg flex items-center justify-center mb-4">
                    <FileText className="h-6 w-6 text-orange-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">Reports & Analytics</h3>
                  <p className="text-gray-400 text-sm">
                    Generate payroll reports and financial analytics
                  </p>
                </div>
              </div>
              
              <div className="mt-12 p-6 bg-gray-900/50 rounded-lg border border-gray-600">
                <p className="text-gray-300">
                  This module is currently under development. Check back soon for updates!
                </p>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

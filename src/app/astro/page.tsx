"use client";

import { useState } from "react";
import { useAuth } from "@/lib/contexts/AuthContext";
import { useTheme } from "@/lib/hooks/useTheme";
import { Sun, Zap, BarChart3, Users, Settings, ChevronRight } from "lucide-react";
import AmbientLogo from "@/components/AmbientLogo";
import MessagesButton from "@/components/MessagesButton";
import Sidebar from "@/components/Sidebar";
import Link from "next/link";

export default function AstroPage() {
  const auth = useAuth();
  const { user, loading, signOut } = auth || {};
  const { darkMode, toggleTheme } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  if (loading) {
    return (
      <div className="flex h-screen theme-bg-primary">
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

  const features = [
    {
      icon: Sun,
      title: "Solar Analytics",
      description: "Advanced solar performance tracking and analytics dashboard",
      status: "Coming Soon"
    },
    {
      icon: Zap,
      title: "Energy Monitoring",
      description: "Real-time energy production and consumption monitoring",
      status: "Coming Soon"
    },
    {
      icon: BarChart3,
      title: "Performance Reports",
      description: "Detailed performance reports and insights",
      status: "Coming Soon"
    },
    {
      icon: Users,
      title: "Customer Portal",
      description: "Customer-facing portal for solar system management",
      status: "Coming Soon"
    },
    {
      icon: Settings,
      title: "System Configuration",
      description: "Configure and manage solar system settings",
      status: "Coming Soon"
    }
  ];

  return (
    <div className="min-h-screen bg-black flex">
      <Sidebar 
        signOut={handleSignOut} 
        darkMode={darkMode} 
        sidebarOpen={sidebarOpen} 
        setSidebarOpen={setSidebarOpen} 
      />
      
      <div className={`flex-1 flex flex-col overflow-hidden transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-0'}`}>
        {/* Header */}
        <header className="bg-black border-b border-gray-600 px-6 py-4 flex-shrink-0">
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
                <div className="h-8 w-8 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-lg flex items-center justify-center">
                  <Sun className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-white">Astro</h1>
                  <p className="text-sm text-gray-400">Solar management and analytics platform</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <MessagesButton />
              <button
                onClick={toggleTheme}
                className="p-2 rounded-lg bg-black hover:bg-gray-800 text-gray-300 transition-colors"
              >
                {darkMode ? '☀️' : '🌙'}
              </button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-auto p-6">
          <div className="max-w-7xl mx-auto">
            {/* Hero Section */}
            <div className="text-center mb-12">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-full mb-6">
                <Sun className="h-10 w-10 text-white" />
              </div>
              <h2 className="text-4xl font-bold text-white mb-4">Welcome to Astro</h2>
              <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto">
                Your comprehensive solar management and analytics platform. Monitor performance, 
                track energy production, and optimize your solar investments.
              </p>
              <div className="inline-flex items-center px-6 py-3 bg-yellow-600 text-white rounded-lg font-medium">
                <Zap className="h-5 w-5 mr-2" />
                Platform Under Development
              </div>
            </div>

            {/* Features Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
              {features.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <div key={index} className="bg-black rounded-lg p-6 border border-gray-600 hover:border-yellow-500/50 transition-colors">
                    <div className="flex items-center mb-4">
                      <div className="h-12 w-12 bg-yellow-500/20 rounded-lg flex items-center justify-center mr-4">
                        <Icon className="h-6 w-6 text-yellow-400" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-white">{feature.title}</h3>
                        <span className="text-sm text-yellow-400 font-medium">{feature.status}</span>
                      </div>
                    </div>
                    <p className="text-gray-300 mb-4">{feature.description}</p>
                    <div className="flex items-center text-gray-400 text-sm">
                      <span>Learn more</span>
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Coming Soon Section */}
            <div className="bg-gradient-to-r from-yellow-600/10 to-orange-600/10 rounded-lg p-8 border border-yellow-500/20">
              <div className="text-center">
                <h3 className="text-2xl font-bold text-white mb-4">Stay Tuned for Updates</h3>
                <p className="text-gray-300 mb-6 max-w-2xl mx-auto">
                  We're working hard to bring you the most advanced solar management tools. 
                  Astro will provide comprehensive analytics, monitoring, and optimization features 
                  for your solar installations.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <button className="px-6 py-3 bg-yellow-600 text-white rounded-lg font-medium hover:bg-yellow-700 transition-colors">
                    Get Notified
                  </button>
                  <button className="px-6 py-3 border border-gray-600 text-gray-300 rounded-lg font-medium hover:bg-black transition-colors">
                    Learn More
                  </button>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

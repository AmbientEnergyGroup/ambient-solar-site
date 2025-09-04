import { useState, useEffect } from "react";
import { 
  Users, LogOut, Home, Map, 
  UserPlus, Code
} from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import AmbientLogo from "./AmbientLogo";
import { useAuth } from "@/lib/contexts/AuthContext";

interface SidebarProps {
  signOut: () => void;
  darkMode: boolean;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

export default function Sidebar({ signOut, darkMode, sidebarOpen, setSidebarOpen }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const auth = useAuth();
  const { user, userData } = auth || {};
  const [showDevCodeInput, setShowDevCodeInput] = useState(false);
  const [devCode, setDevCode] = useState("");
  const [devModeActive, setDevModeActive] = useState(false);
  
  // Check if user is a closer (has access to Closer Core and Schedule)
  const isCloser = userData?.role === 'closer';
  
  // Simple prefetch for faster navigation
  useEffect(() => {
    if (sidebarOpen) {
      const routes = ['/dashboard', '/canvassing', '/messages', '/sets', '/projects', '/team', '/closer-core', '/schedule', '/pipeline', '/payroll', '/taskmaster', '/hr', '/astro', '/rep-tree'];
      routes.forEach(route => {
        router.prefetch(route);
      });
    }
  }, [router, sidebarOpen]);
  
  // Handle developer code input
  const handleDevCodeSubmit = () => {
    if (devCode === "4242") {
      setDevModeActive(true);
      setShowDevCodeInput(false);
    } else {
      setDevCode("");
    }
  };
  
  return (
    <div className={`${sidebarOpen ? 'w-64' : 'w-0'} theme-bg-tertiary shadow-md transition-all duration-300 overflow-hidden flex flex-col h-screen z-50 fixed left-0 top-0`}>
      <div className="p-4 border-b theme-border-secondary flex-shrink-0">
        {sidebarOpen ? (
          <div className="flex items-center">
            <AmbientLogo theme={darkMode ? 'dark' : 'light'} size="lg" />
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center">
            <div className="flex flex-col items-center w-full">
              <AmbientLogo theme={darkMode ? 'dark' : 'light'} size="lg" />
            </div>
          </div>
        )}
      </div>
      
      <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800">
        <nav className="py-4 space-y-1">
          {/* Dashboard - Always at top */}
          <a href="/dashboard" className={`flex items-center px-4 py-3 ${
            pathname === '/dashboard' 
              ? 'theme-text-primary theme-bg-active' 
              : 'theme-text-secondary hover:theme-text-primary hover:bg-opacity-10 hover:bg-gray-500 transition-colors duration-200'
          }`}>
            <Home className="h-5 w-5 mr-3" />
            Dashboard
          </a>

          {/* Sales Section */}
          <div className="px-4 py-2">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Sales</h3>
          </div>
          
          <a href="/canvassing" className={`flex items-center px-4 py-3 ${
            pathname === '/canvassing' 
              ? 'theme-text-primary theme-bg-active' 
              : 'text-gray-400 hover:text-gray-500 transition-colors duration-200 cursor-not-allowed'
          }`}>
            <Map className="h-5 w-5 mr-3" />
            Canvassing
          </a>
          <a href="/messages" className={`flex items-center px-4 py-3 ${
            pathname === '/messages' 
              ? 'theme-text-primary theme-bg-active' 
              : 'text-gray-400 hover:text-gray-500 transition-colors duration-200 cursor-not-allowed'
          }`}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
            Messages
          </a>
          <a href="/sets" className={`flex items-center px-4 py-3 ${
            pathname === '/sets' 
              ? 'theme-text-primary theme-bg-active' 
              : 'theme-text-secondary hover:theme-text-primary hover:bg-opacity-10 hover:bg-gray-500 transition-colors duration-200'
          }`}>
            <Users className="h-5 w-5 mr-3" />
            Sets
          </a>
          <a href="/projects" className={`flex items-center px-4 py-3 ${
            pathname === '/projects' 
              ? 'theme-text-primary theme-bg-active' 
              : 'theme-text-secondary hover:theme-text-primary hover:bg-opacity-10 hover:bg-gray-500 transition-colors duration-200'
          }`}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            Projects
          </a>
          <a href="/team" className={`flex items-center px-4 py-3 ${
            pathname === '/team' 
              ? 'theme-text-primary theme-bg-active' 
              : 'theme-text-secondary hover:theme-text-primary hover:bg-opacity-10 hover:bg-gray-500 transition-colors duration-200'
          }`}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
            </svg>
            Team
          </a>
          {/* Closer Core - Only for closers */}
          {isCloser && (
            <a href="/closer-core" className={`flex items-center px-4 py-3 ${
              pathname === '/closer-core' 
                ? 'theme-text-primary theme-bg-active' 
                : 'theme-text-secondary hover:theme-text-primary hover:bg-opacity-10 hover:bg-gray-500 transition-colors duration-200'
            }`}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Closer Core
            </a>
          )}
          
          {/* Schedule - Only for closers */}
          {isCloser && (
            <a href="/schedule" className={`flex items-center px-4 py-3 ${
              pathname === '/schedule' 
                ? 'theme-text-primary theme-bg-active' 
                : 'theme-text-secondary hover:theme-text-primary hover:bg-opacity-10 hover:bg-gray-500 transition-colors duration-200'
            }`}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Schedule
            </a>
          )}
          <a href="/hr" className={`flex items-center px-4 py-3 ${
            pathname === '/hr' 
              ? 'theme-text-primary theme-bg-active' 
              : 'theme-text-secondary hover:theme-text-primary hover:bg-opacity-10 hover:bg-gray-500 transition-colors duration-200'
          }`}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            HR
          </a>

          {/* Operations Section */}
          <div className="px-4 py-2 mt-6">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Operations</h3>
          </div>

          {/* Pipeline link - Admin only */}
          {user?.role === 'admin' && (
            <a href="/pipeline" className={`flex items-center px-4 py-3 ${
              pathname === '/pipeline' 
                ? 'theme-text-primary theme-bg-active' 
                : 'theme-text-secondary hover:theme-text-primary hover:bg-opacity-10 hover:bg-gray-500 transition-colors duration-200'
            }`}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Pipeline
            </a>
          )}

          <a href="/payroll" className={`flex items-center px-4 py-3 ${
            pathname === '/payroll' 
              ? 'theme-text-primary theme-bg-active' 
              : 'theme-text-secondary hover:theme-text-primary hover:bg-opacity-10 hover:bg-gray-500 transition-colors duration-200'
          }`}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
            </svg>
            Payroll
          </a>

          <a href="/taskmaster" className={`flex items-center px-4 py-3 ${
            pathname === '/taskmaster' 
              ? 'theme-text-primary theme-bg-active' 
              : 'theme-text-secondary hover:theme-text-primary hover:bg-opacity-10 hover:bg-gray-500 transition-colors duration-200'
          }`}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
            Taskmaster
          </a>

          {/* Organization Section */}
          <div className="px-4 py-2 mt-6">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Organization</h3>
          </div>

          <a href="/astro" className={`flex items-center px-4 py-3 ${
            pathname === '/astro' 
              ? 'theme-text-primary theme-bg-active' 
              : 'theme-text-secondary hover:theme-text-primary hover:bg-opacity-10 hover:bg-gray-500 transition-colors duration-200'
          }`}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            Astro
          </a>

          <a href="/rep-tree" className={`flex items-center px-4 py-3 ${
            pathname === '/rep-tree' 
              ? 'theme-text-primary theme-bg-active' 
              : 'theme-text-secondary hover:theme-text-primary hover:bg-opacity-10 hover:bg-gray-500 transition-colors duration-200'
          }`}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            Rep Tree
          </a>
          </nav>
      </div>
      
      <div className="border-t theme-border-secondary p-4 flex-shrink-0">
        {/* Developer section with passcode */}
        {!devModeActive && !showDevCodeInput ? (
          <button 
            onClick={() => setShowDevCodeInput(true)}
            className="flex items-center px-4 py-2 theme-text-secondary hover:theme-text-primary w-full transition-colors duration-200"
          >
            <Code className="h-5 w-5 mr-3" />
            Developer
          </button>
        ) : !devModeActive && showDevCodeInput ? (
          <div className="space-y-2 px-4">
            <div className="flex items-center">
              <Code className="h-5 w-5 mr-3 theme-text-secondary" />
              <span className="theme-text-secondary text-sm">Enter Code</span>
            </div>
            <div className="flex space-x-2">
              <input 
                type="password"
                value={devCode}
                onChange={(e) => setDevCode(e.target.value)}
                className="w-full px-2 py-1 rounded text-sm theme-bg-quaternary theme-border-primary border theme-text-primary focus:outline-none"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleDevCodeSubmit();
                  if (e.key === 'Escape') {
                    setShowDevCodeInput(false);
                    setDevCode("");
                  }
                }}
                placeholder="Enter code"
                autoFocus
              />
              <button 
                onClick={handleDevCodeSubmit}
                className="px-2 py-1 rounded text-xs theme-text-primary theme-bg-quaternary hover:opacity-80"
              >
                Go
              </button>
            </div>
          </div>
        ) : (
          <div>
            <a href="/developer" className={`flex items-center px-4 py-3 ${
              pathname === '/developer' 
                ? 'theme-text-primary theme-bg-active' 
                : 'theme-text-secondary hover:theme-text-primary hover:bg-opacity-10 hover:bg-gray-500 transition-colors duration-200'
            }`}>
              <Code className="h-5 w-5 mr-3" />
              Developer Console
            </a>
            <button 
              onClick={() => setDevModeActive(false)}
              className="ml-8 mt-1 text-xs theme-text-secondary hover:theme-text-primary transition-colors duration-200"
            >
              Exit Dev Mode
            </button>
          </div>
        )}
        
        <a href="/account" className={`flex items-center px-4 py-2 mt-2 ${
          pathname === '/account' 
            ? 'theme-text-primary' 
            : 'theme-text-secondary hover:theme-text-primary'
        } w-full transition-colors duration-200`}>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          Account Settings
        </a>
        <button 
          onClick={signOut}
          className="flex items-center px-4 py-2 mt-2 theme-text-secondary hover:theme-text-primary w-full transition-colors duration-200"
        >
          <LogOut className="h-5 w-5 mr-3" />
          Sign Out
        </button>
      </div>
    </div>
  );
} 
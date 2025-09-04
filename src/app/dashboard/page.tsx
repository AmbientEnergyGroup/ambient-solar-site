"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/contexts/AuthContext";
import { BarChart3, Calendar, DollarSign, Menu, Check } from "lucide-react";
import AmbientLogo from "@/components/AmbientLogo";
import MessagesButton from "@/components/MessagesButton";
import Sidebar from "@/components/Sidebar";
import { useTheme } from "@/lib/hooks/useTheme";

// Safely parse JSON from localStorage with fallback
const safelyParseJSON = (key: string, defaultValue: any = []) => {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : defaultValue;
  } catch (error) {
    console.error(`Error parsing ${key}:`, error);
    return defaultValue;
  }
};

export default function Dashboard() {
  const auth = useAuth();
  const { user, loading, signOut, userData } = auth || {};
  const router = useRouter();
  const { darkMode } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [headerVisible, setHeaderVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [dashboardStats, setDashboardStats] = useState({
    salesThisWeek: 0,
    ytdPay: 0,
    nextPayday: {
      amount: 0,
      date: ""
    },
    totalKWOnPayroll: 0,
    totalPayPeriodAmount: 0,
    payPeriodLength: "2 Weeks"
  });
  
  // Format currency
  const formatCurrency = (value: number, minimumFractionDigits = 2, maximumFractionDigits = 2) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits,
      maximumFractionDigits
    }).format(value);
  };

  // Format date
  const formatDate = (dateString: string) => {
    if (!dateString) return "Not scheduled";
    
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Calculate dashboard statistics
  const calculateDashboardStats = useCallback(() => {
    if (typeof window === 'undefined' || !user) return;
    
    try {
      // Use safe parsing with default values
      const allProjectsData = safelyParseJSON('projects', []);
      
      // Get current date and calculate date ranges
      const now = new Date();
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay()); // Sunday of current week
      startOfWeek.setHours(0, 0, 0, 0);
      
      const startOfYear = new Date(now.getFullYear(), 0, 1); // January 1 of current year
      
      // Filter projects for current week
      const currentWeekProjects = allProjectsData.filter((project: any) => {
        if (!project || !project.createdAt) return false;
        try {
          const projectDate = new Date(project.createdAt);
          return projectDate >= startOfWeek && projectDate <= now;
        } catch (e) {
          return false;
        }
      });
      
      // Calculate sales this week
      const salesThisWeek = currentWeekProjects.reduce((sum: number, p: any) => {
        const systemSize = parseFloat(p.systemSize || '0');
        const ppw = parseFloat(p.grossPPW || '0');
        return sum + (systemSize * ppw * 1000); // kW * PPW * 1000 = total contract value
      }, 0);
      
      // Get commission payments from userData
      const commissionPayments = (userData as any)?.commissionPayments || [];
      
      // Calculate HR stats for box 1
      let totalKWOnPayroll = 0;
      let totalPayPeriodAmount = 0;
      let payPeriodLength = "2 Weeks"; // Default
      
      if (commissionPayments.length > 0) {
        // Calculate total KW from all commission payments
        totalKWOnPayroll = commissionPayments.reduce((sum: number, payment: any) => {
          return sum + (payment.systemSize || 0);
        }, 0);
        
        // Calculate total pending payments for current pay period
        const pendingPayments = commissionPayments.filter((payment: any) => payment.status === 'pending');
        totalPayPeriodAmount = pendingPayments.reduce((sum: number, payment: any) => sum + payment.amount, 0);
        
        // Determine pay period length based on payment dates (if available)
        if (pendingPayments.length > 1) {
          const dates = pendingPayments.map((p: any) => new Date(p.date)).sort((a: Date, b: Date) => a.getTime() - b.getTime());
          const firstDate = dates[0];
          const lastDate = dates[dates.length - 1];
          const daysDiff = Math.ceil((lastDate.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24));
          
          if (daysDiff <= 7) {
            payPeriodLength = "1 Week";
          } else if (daysDiff <= 14) {
            payPeriodLength = "2 Weeks";
          } else if (daysDiff <= 30) {
            payPeriodLength = "1 Month";
          }
        }
      }
      
      // Calculate YTD and next payday (existing logic)
      let ytdPay = 0;
      let nextPaydayAmount = 0;
      let nextPaydayDate = "";
      
      if (commissionPayments.length > 0) {
        // YTD Pay: sum of all paid commissions in current year
        ytdPay = commissionPayments
          .filter((payment: any) => {
            if (!payment || !payment.date || payment.status !== 'paid') return false;
            const paymentDate = new Date(payment.date);
            return paymentDate >= startOfYear && paymentDate <= now;
          })
          .reduce((sum: number, payment: any) => sum + payment.amount, 0);
        
        // Next Payday: find nearest future pending payment
        const futurePayments = commissionPayments
          .filter((payment: any) => {
            if (!payment || !payment.date || payment.status !== 'pending') return false;
            const paymentDate = new Date(payment.date);
            return paymentDate >= now;
          })
          .sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());
        
        if (futurePayments.length > 0) {
          nextPaydayAmount = futurePayments
            .filter((p: any) => p.date === futurePayments[0].date)
            .reduce((sum: number, p: any) => sum + p.amount, 0);
          nextPaydayDate = futurePayments[0].date;
        }
      }
      
      setDashboardStats({
        salesThisWeek,
        ytdPay,
        nextPayday: {
          amount: nextPaydayAmount,
          date: nextPaydayDate
        },
        // Add HR-specific stats
        totalKWOnPayroll,
        totalPayPeriodAmount,
        payPeriodLength
      });
      
    } catch (err) {
      console.error("Error calculating dashboard stats:", err);
      // Set fallback values on error
      setDashboardStats({
        salesThisWeek: 0,
        ytdPay: 0,
        nextPayday: {
          amount: 0,
          date: ""
        },
        totalKWOnPayroll: 0,
        totalPayPeriodAmount: 0,
        payPeriodLength: "2 Weeks"
      });
    }
  }, [user, userData]);
  
  // Calculate dashboard stats when component mounts
  useEffect(() => {
    if (user) {
      // Add a small delay to avoid blocking the main thread during initial load
      const timer = setTimeout(() => {
        calculateDashboardStats();
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [user, calculateDashboardStats]);

  // Handle scroll events for header visibility
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        // Scrolling down and past initial 100px
        setHeaderVisible(false);
      } else if (currentScrollY < lastScrollY) {
        // Scrolling up
        setHeaderVisible(true);
      }
      
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

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
        <div className="text-center">
          <div className={`animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 ${darkMode ? 'border-cyan-500' : 'border-cyan-500'} mx-auto mb-4`}></div>
          <p className="text-gray-500">Loading dashboard...</p>
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
      <div className={`flex-1 overflow-auto theme-bg-secondary transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-0'}`}>
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

        {/* Dashboard content */}
        <main className="p-4 sm:p-6 pt-20 sm:pt-24">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            {/* Payday for upcoming week */}
            <div className="bg-cyan-500 rounded-lg shadow p-4 sm:p-8 row-span-2 flex flex-col justify-between h-[calc(100vh-8rem)] relative overflow-hidden">
              {/* Watermark Pattern */}
              <div className="absolute inset-0 pointer-events-none select-none z-0">
                {/* Row 1 */}
                <div className="absolute inset-0 flex items-center justify-center" style={{ transform: 'translate(-800px, -450px)' }}>
                  <div className="text-white text-4xl font-black transform -rotate-45 opacity-10">
                    AMBIENT
                  </div>
                </div>
                <div className="absolute inset-0 flex items-center justify-center" style={{ transform: 'translate(-600px, -450px)' }}>
                  <div className="text-white text-4xl font-black transform -rotate-45 opacity-10">
                    AMBIENT
                  </div>
                </div>
                <div className="absolute inset-0 flex items-center justify-center" style={{ transform: 'translate(-400px, -450px)' }}>
                  <div className="text-white text-4xl font-black transform -rotate-45 opacity-10">
                    AMBIENT
                  </div>
                </div>
                <div className="absolute inset-0 flex items-center justify-center" style={{ transform: 'translate(-200px, -450px)' }}>
                  <div className="text-white text-4xl font-black transform -rotate-45 opacity-10">
                    AMBIENT
                  </div>
                </div>
                <div className="absolute inset-0 flex items-center justify-center" style={{ transform: 'translate(0px, -450px)' }}>
                  <div className="text-white text-4xl font-black transform -rotate-45 opacity-10">
                    AMBIENT
                  </div>
                </div>
                <div className="absolute inset-0 flex items-center justify-center" style={{ transform: 'translate(200px, -450px)' }}>
                  <div className="text-white text-4xl font-black transform -rotate-45 opacity-10">
                    AMBIENT
                  </div>
                </div>
                <div className="absolute inset-0 flex items-center justify-center" style={{ transform: 'translate(400px, -450px)' }}>
                  <div className="text-white text-4xl font-black transform -rotate-45 opacity-10">
                    AMBIENT
                  </div>
                </div>
                <div className="absolute inset-0 flex items-center justify-center" style={{ transform: 'translate(600px, -450px)' }}>
                  <div className="text-white text-4xl font-black transform -rotate-45 opacity-10">
                    AMBIENT
                  </div>
                </div>
                <div className="absolute inset-0 flex items-center justify-center" style={{ transform: 'translate(800px, -450px)' }}>
                  <div className="text-white text-4xl font-black transform -rotate-45 opacity-10">
                    AMBIENT
                  </div>
                </div>

                {/* Row 2 */}
                <div className="absolute inset-0 flex items-center justify-center" style={{ transform: 'translate(-800px, -300px)' }}>
                  <div className="text-white text-4xl font-black transform -rotate-45 opacity-10">
                    AMBIENT
                  </div>
                </div>
                <div className="absolute inset-0 flex items-center justify-center" style={{ transform: 'translate(-600px, -300px)' }}>
                  <div className="text-white text-4xl font-black transform -rotate-45 opacity-10">
                    AMBIENT
                  </div>
                </div>
                <div className="absolute inset-0 flex items-center justify-center" style={{ transform: 'translate(-400px, -300px)' }}>
                  <div className="text-white text-4xl font-black transform -rotate-45 opacity-10">
                    AMBIENT
                  </div>
                </div>
                <div className="absolute inset-0 flex items-center justify-center" style={{ transform: 'translate(-200px, -300px)' }}>
                  <div className="text-white text-4xl font-black transform -rotate-45 opacity-10">
                    AMBIENT
                  </div>
                </div>
                <div className="absolute inset-0 flex items-center justify-center" style={{ transform: 'translate(0px, -300px)' }}>
                  <div className="text-white text-4xl font-black transform -rotate-45 opacity-10">
                    AMBIENT
                  </div>
                </div>
                <div className="absolute inset-0 flex items-center justify-center" style={{ transform: 'translate(200px, -300px)' }}>
                  <div className="text-white text-4xl font-black transform -rotate-45 opacity-10">
                    AMBIENT
                  </div>
                </div>
                <div className="absolute inset-0 flex items-center justify-center" style={{ transform: 'translate(400px, -300px)' }}>
                  <div className="text-white text-4xl font-black transform -rotate-45 opacity-10">
                    AMBIENT
                  </div>
                </div>
                <div className="absolute inset-0 flex items-center justify-center" style={{ transform: 'translate(600px, -300px)' }}>
                  <div className="text-white text-4xl font-black transform -rotate-45 opacity-10">
                    AMBIENT
                  </div>
                </div>
                <div className="absolute inset-0 flex items-center justify-center" style={{ transform: 'translate(800px, -300px)' }}>
                  <div className="text-white text-4xl font-black transform -rotate-45 opacity-10">
                    AMBIENT
                  </div>
                </div>

                {/* Row 3 */}
                <div className="absolute inset-0 flex items-center justify-center" style={{ transform: 'translate(-800px, -150px)' }}>
                  <div className="text-white text-4xl font-black transform -rotate-45 opacity-10">
                    AMBIENT
                  </div>
                </div>
                <div className="absolute inset-0 flex items-center justify-center" style={{ transform: 'translate(-600px, -150px)' }}>
                  <div className="text-white text-4xl font-black transform -rotate-45 opacity-10">
                    AMBIENT
                  </div>
                </div>
                <div className="absolute inset-0 flex items-center justify-center" style={{ transform: 'translate(-400px, -150px)' }}>
                  <div className="text-white text-4xl font-black transform -rotate-45 opacity-10">
                    AMBIENT
                  </div>
                </div>
                <div className="absolute inset-0 flex items-center justify-center" style={{ transform: 'translate(-200px, -150px)' }}>
                  <div className="text-white text-4xl font-black transform -rotate-45 opacity-10">
                    AMBIENT
                  </div>
                </div>
                <div className="absolute inset-0 flex items-center justify-center" style={{ transform: 'translate(0px, -150px)' }}>
                  <div className="text-white text-4xl font-black transform -rotate-45 opacity-10">
                    AMBIENT
                  </div>
                </div>
                <div className="absolute inset-0 flex items-center justify-center" style={{ transform: 'translate(200px, -150px)' }}>
                  <div className="text-white text-4xl font-black transform -rotate-45 opacity-10">
                    AMBIENT
                  </div>
                </div>
                <div className="absolute inset-0 flex items-center justify-center" style={{ transform: 'translate(400px, -150px)' }}>
                  <div className="text-white text-4xl font-black transform -rotate-45 opacity-10">
                    AMBIENT
                  </div>
                </div>
                <div className="absolute inset-0 flex items-center justify-center" style={{ transform: 'translate(600px, -150px)' }}>
                  <div className="text-white text-4xl font-black transform -rotate-45 opacity-10">
                    AMBIENT
                  </div>
                </div>
                <div className="absolute inset-0 flex items-center justify-center" style={{ transform: 'translate(800px, -150px)' }}>
                  <div className="text-white text-4xl font-black transform -rotate-45 opacity-10">
                    AMBIENT
                  </div>
                </div>

                {/* Row 4 */}
                <div className="absolute inset-0 flex items-center justify-center" style={{ transform: 'translate(-800px, 0px)' }}>
                  <div className="text-white text-4xl font-black transform -rotate-45 opacity-10">
                    AMBIENT
                  </div>
                </div>
                <div className="absolute inset-0 flex items-center justify-center" style={{ transform: 'translate(-600px, 0px)' }}>
                  <div className="text-white text-4xl font-black transform -rotate-45 opacity-10">
                    AMBIENT
                  </div>
                </div>
                <div className="absolute inset-0 flex items-center justify-center" style={{ transform: 'translate(-400px, 0px)' }}>
                  <div className="text-white text-4xl font-black transform -rotate-45 opacity-10">
                    AMBIENT
                  </div>
                </div>
                <div className="absolute inset-0 flex items-center justify-center" style={{ transform: 'translate(-200px, 0px)' }}>
                  <div className="text-white text-4xl font-black transform -rotate-45 opacity-10">
                    AMBIENT
                  </div>
                </div>
                <div className="absolute inset-0 flex items-center justify-center" style={{ transform: 'translate(0px, 0px)' }}>
                  <div className="text-white text-4xl font-black transform -rotate-45 opacity-10">
                    AMBIENT
                  </div>
                </div>
                <div className="absolute inset-0 flex items-center justify-center" style={{ transform: 'translate(200px, 0px)' }}>
                  <div className="text-white text-4xl font-black transform -rotate-45 opacity-10">
                    AMBIENT
                  </div>
                </div>
                <div className="absolute inset-0 flex items-center justify-center" style={{ transform: 'translate(400px, 0px)' }}>
                  <div className="text-white text-4xl font-black transform -rotate-45 opacity-10">
                    AMBIENT
                  </div>
                </div>
                <div className="absolute inset-0 flex items-center justify-center" style={{ transform: 'translate(600px, 0px)' }}>
                  <div className="text-white text-4xl font-black transform -rotate-45 opacity-10">
                    AMBIENT
                  </div>
                </div>
                <div className="absolute inset-0 flex items-center justify-center" style={{ transform: 'translate(800px, 0px)' }}>
                  <div className="text-white text-4xl font-black transform -rotate-45 opacity-10">
                    AMBIENT
                  </div>
                </div>

                {/* Row 5 */}
                <div className="absolute inset-0 flex items-center justify-center" style={{ transform: 'translate(-800px, 150px)' }}>
                  <div className="text-white text-4xl font-black transform -rotate-45 opacity-10">
                    AMBIENT
                  </div>
                </div>
                <div className="absolute inset-0 flex items-center justify-center" style={{ transform: 'translate(-600px, 150px)' }}>
                  <div className="text-white text-4xl font-black transform -rotate-45 opacity-10">
                    AMBIENT
                  </div>
                </div>
                <div className="absolute inset-0 flex items-center justify-center" style={{ transform: 'translate(-400px, 150px)' }}>
                  <div className="text-white text-4xl font-black transform -rotate-45 opacity-10">
                    AMBIENT
                  </div>
                </div>
                <div className="absolute inset-0 flex items-center justify-center" style={{ transform: 'translate(-200px, 150px)' }}>
                  <div className="text-white text-4xl font-black transform -rotate-45 opacity-10">
                    AMBIENT
                  </div>
                </div>
                <div className="absolute inset-0 flex items-center justify-center" style={{ transform: 'translate(0px, 150px)' }}>
                  <div className="text-white text-4xl font-black transform -rotate-45 opacity-10">
                    AMBIENT
                  </div>
                </div>
                <div className="absolute inset-0 flex items-center justify-center" style={{ transform: 'translate(200px, 150px)' }}>
                  <div className="text-white text-4xl font-black transform -rotate-45 opacity-10">
                    AMBIENT
                  </div>
                </div>
                <div className="absolute inset-0 flex items-center justify-center" style={{ transform: 'translate(400px, 150px)' }}>
                  <div className="text-white text-4xl font-black transform -rotate-45 opacity-10">
                    AMBIENT
                  </div>
                </div>
                <div className="absolute inset-0 flex items-center justify-center" style={{ transform: 'translate(600px, 150px)' }}>
                  <div className="text-white text-4xl font-black transform -rotate-45 opacity-10">
                    AMBIENT
                  </div>
                </div>
                <div className="absolute inset-0 flex items-center justify-center" style={{ transform: 'translate(800px, 150px)' }}>
                  <div className="text-white text-4xl font-black transform -rotate-45 opacity-10">
                    AMBIENT
                  </div>
                </div>

                {/* Row 6 */}
                <div className="absolute inset-0 flex items-center justify-center" style={{ transform: 'translate(-800px, 300px)' }}>
                  <div className="text-white text-4xl font-black transform -rotate-45 opacity-10">
                    AMBIENT
                  </div>
                </div>
                <div className="absolute inset-0 flex items-center justify-center" style={{ transform: 'translate(-600px, 300px)' }}>
                  <div className="text-white text-4xl font-black transform -rotate-45 opacity-10">
                    AMBIENT
                  </div>
                </div>
                <div className="absolute inset-0 flex items-center justify-center" style={{ transform: 'translate(-400px, 300px)' }}>
                  <div className="text-white text-4xl font-black transform -rotate-45 opacity-10">
                    AMBIENT
                  </div>
                </div>
                <div className="absolute inset-0 flex items-center justify-center" style={{ transform: 'translate(-200px, 300px)' }}>
                  <div className="text-white text-4xl font-black transform -rotate-45 opacity-10">
                    AMBIENT
                  </div>
                </div>
                <div className="absolute inset-0 flex items-center justify-center" style={{ transform: 'translate(0px, 300px)' }}>
                  <div className="text-white text-4xl font-black transform -rotate-45 opacity-10">
                    AMBIENT
                  </div>
                </div>
                <div className="absolute inset-0 flex items-center justify-center" style={{ transform: 'translate(200px, 300px)' }}>
                  <div className="text-white text-4xl font-black transform -rotate-45 opacity-10">
                    AMBIENT
                  </div>
                </div>
                <div className="absolute inset-0 flex items-center justify-center" style={{ transform: 'translate(400px, 300px)' }}>
                  <div className="text-white text-4xl font-black transform -rotate-45 opacity-10">
                    AMBIENT
                  </div>
                </div>
                <div className="absolute inset-0 flex items-center justify-center" style={{ transform: 'translate(600px, 300px)' }}>
                  <div className="text-white text-4xl font-black transform -rotate-45 opacity-10">
                    AMBIENT
                  </div>
                </div>
                <div className="absolute inset-0 flex items-center justify-center" style={{ transform: 'translate(800px, 300px)' }}>
                  <div className="text-white text-4xl font-black transform -rotate-45 opacity-10">
                    AMBIENT
                  </div>
                </div>

                {/* Row 7 */}
                <div className="absolute inset-0 flex items-center justify-center" style={{ transform: 'translate(-800px, 450px)' }}>
                  <div className="text-white text-4xl font-black transform -rotate-45 opacity-10">
                    AMBIENT
                  </div>
                </div>
                <div className="absolute inset-0 flex items-center justify-center" style={{ transform: 'translate(-600px, 450px)' }}>
                  <div className="text-white text-4xl font-black transform -rotate-45 opacity-10">
                    AMBIENT
                  </div>
                </div>
                <div className="absolute inset-0 flex items-center justify-center" style={{ transform: 'translate(-400px, 450px)' }}>
                  <div className="text-white text-4xl font-black transform -rotate-45 opacity-10">
                    AMBIENT
                  </div>
                </div>
                <div className="absolute inset-0 flex items-center justify-center" style={{ transform: 'translate(-200px, 450px)' }}>
                  <div className="text-white text-4xl font-black transform -rotate-45 opacity-10">
                    AMBIENT
                  </div>
                </div>
                <div className="absolute inset-0 flex items-center justify-center" style={{ transform: 'translate(0px, 450px)' }}>
                  <div className="text-white text-4xl font-black transform -rotate-45 opacity-10">
                    AMBIENT
                  </div>
                </div>
                <div className="absolute inset-0 flex items-center justify-center" style={{ transform: 'translate(200px, 450px)' }}>
                  <div className="text-white text-4xl font-black transform -rotate-45 opacity-10">
                    AMBIENT
                  </div>
                </div>
                <div className="absolute inset-0 flex items-center justify-center" style={{ transform: 'translate(400px, 450px)' }}>
                  <div className="text-white text-4xl font-black transform -rotate-45 opacity-10">
                    AMBIENT
                  </div>
                </div>
                <div className="absolute inset-0 flex items-center justify-center" style={{ transform: 'translate(600px, 450px)' }}>
                  <div className="text-white text-4xl font-black transform -rotate-45 opacity-10">
                    AMBIENT
                  </div>
                </div>
                <div className="absolute inset-0 flex items-center justify-center" style={{ transform: 'translate(800px, 450px)' }}>
                  <div className="text-white text-4xl font-black transform -rotate-45 opacity-10">
                    AMBIENT
                  </div>
                </div>
              </div>
              {/* Header with icon and title */}
              <div className="flex items-center justify-between mb-4 relative z-10">
                <div className="flex items-center">
                  <a href="/hr" className="p-2 hover:bg-black hover:bg-opacity-10 rounded-full transition-all cursor-pointer">
                    <svg className="h-12 w-12 text-black" style={{ animation: 'horizontalSpin 3s linear infinite' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </a>
                  <div className="ml-4">
                    <h3 className="text-black text-3xl font-bold" style={{ WebkitTextFillColor: 'black', WebkitTextStroke: '1px black' }}>Pay Period</h3>
                  </div>
                </div>
              </div>

              {/* Centered stats section */}
              <div className="flex-1 flex justify-center items-center relative z-10">
                <div className="flex justify-center items-center">
                  {/* KW on Payroll */}
                  <div className="text-center mx-8">
                    <h4 className="text-black text-2xl font-extrabold mb-3 tracking-wide uppercase" style={{ WebkitTextFillColor: 'black', WebkitTextStroke: '1px black' }}>KW on Payroll</h4>
                    <p className="text-8xl font-black text-black tracking-tight" style={{ WebkitTextFillColor: 'black', WebkitTextStroke: '1px black' }}>{dashboardStats.totalKWOnPayroll.toFixed(1)}</p>
                  </div>
                  
                  {/* Pay Period Length */}
                  <div className="text-center border-l-4 border-r-4 border-black px-8 mx-4">
                    <h4 className="text-black text-2xl font-extrabold mb-3 tracking-wide uppercase" style={{ WebkitTextFillColor: 'black', WebkitTextStroke: '1px black' }}>Pay Period Length</h4>
                    <p className="text-8xl font-black text-black tracking-tight" style={{ WebkitTextFillColor: 'black', WebkitTextStroke: '1px black' }}>6 Days</p>
                  </div>
                  
                  {/* Total Pay */}
                  <div className="text-center mx-8">
                    <h4 className="text-black text-2xl font-extrabold mb-3 tracking-wide uppercase" style={{ WebkitTextFillColor: 'black', WebkitTextStroke: '1px black' }}>Total Pay</h4>
                    <p className="text-8xl font-black text-black tracking-tight" style={{ WebkitTextFillColor: 'black', WebkitTextStroke: '1px black' }}>{formatCurrency(dashboardStats.totalPayPeriodAmount)}</p>
                  </div>
                </div>
              </div>


            </div>

            {/* YTD Pay */}
            <div className="bg-cyan-500 rounded-lg shadow p-8 flex flex-col justify-between h-[calc(50vh-5rem)] relative overflow-hidden">
              {/* 2025 Watermark */}
              <div className="absolute inset-0 pointer-events-none select-none z-0 flex items-center justify-center">
                <div className="text-white text-[30rem] font-black opacity-10 tracking-widest">
                  2025
                </div>
              </div>
              
              {/* Content */}
              <div className="relative z-10 h-full flex flex-col">
                {/* Top section with icon and title */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <a href="/hr" className="p-2 hover:bg-black hover:bg-opacity-10 rounded-full transition-all cursor-pointer">
                      <svg className="h-12 w-12 text-black" style={{ animation: 'horizontalSpin 3s linear infinite' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </a>
                    <div className="ml-4">
                      <h3 className="text-black text-3xl font-bold" style={{ WebkitTextFillColor: 'black', WebkitTextStroke: '1px black' }}>YTD PAY</h3>
                    </div>
                  </div>
                </div>
                
                {/* Centered amount in the middle of the box */}
                <div className="flex-1 flex items-center justify-center" style={{ transform: 'translateY(-60px)' }}>
                  <p className="text-[10rem] font-black text-black tracking-tight" style={{ WebkitTextFillColor: 'black', WebkitTextStroke: '1px black' }}>
                    {formatCurrency(dashboardStats.ytdPay)}
                  </p>
                </div>
              </div>
            </div>

                        {/* Sales This Week */}
            <div className="bg-cyan-500 rounded-lg shadow p-8 flex flex-col justify-between h-[calc(50vh-5rem)] relative overflow-hidden">
              {/* JULY Watermark */}
              <div className="absolute inset-0 pointer-events-none select-none z-0 flex items-center justify-center">
                <div className="text-white text-[30rem] font-black opacity-10 tracking-widest">
                  JULY
                </div>
              </div>
              
              {/* Content */}
              <div className="relative z-10 h-full flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <div className="p-2">
                    <Check className="h-12 w-12 text-black" strokeWidth={3} style={{ color: 'black' }} />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-black text-3xl font-bold" style={{ WebkitTextFillColor: 'black', WebkitTextStroke: '1px black' }}>Monthly Team Production</h3>
                  </div>
                </div>
              </div>
              
              {/* Centered amount in the middle of the box */}
              <div className="flex-1 flex items-center justify-center" style={{ transform: 'translateY(-20px)' }}>
                <p className="text-[10rem] font-black text-black tracking-tight" style={{ WebkitTextFillColor: 'black', WebkitTextStroke: '1px black' }}>
                  $0.00
                </p>
              </div>
              </div>
            </div>
          </div>

                    {/* Second row of boxes - Baseball Cards */}
          <div className="grid grid-cols-3 gap-6 mb-6 mt-6">
            {/* Box 4 - Personal Baseball Card */}
            <div className="bg-gradient-to-br from-cyan-400 to-cyan-600 rounded-lg shadow-lg p-6 flex flex-col justify-center items-center h-[calc(50vh-5rem)] relative overflow-hidden">
              {/* Card title - outside border */}
              <h3 className="text-black text-3xl font-bold uppercase tracking-wider absolute top-2 left-1/2 transform -translate-x-1/2" style={{ WebkitTextFillColor: 'black', WebkitTextStroke: '1px black' }}>
                Personal Stats
              </h3>
              {/* Inner baseball card - same shape as outer box */}
              <div className="bg-white rounded-lg border-2 border-white w-full h-full mt-8 flex flex-col justify-center items-center relative opacity-10">
                {/* Center text */}
                <div className="absolute left-1/2 top-1/2 transform -translate-y-1/2 flex flex-col items-center space-y-6">
                  <div className="text-center">
                    <span className="text-black text-lg font-bold uppercase tracking-wider">
                      Experience Level: 
                    </span>
                    <span className="text-black text-2xl font-black ml-2">
                      Rookie
                    </span>
                  </div>
                  
                  {/* Separator line */}
                  <div className="w-24 h-0.5 bg-black opacity-50"></div>
                  
                  <div className="text-center">
                    <span className="text-black text-lg font-bold uppercase tracking-wider">
                      Hometown: 
                    </span>
                    <span className="text-black text-2xl font-black ml-2">
                      N/A
                    </span>
                  </div>
                  
                  {/* Separator line */}
                  <div className="w-24 h-0.5 bg-black opacity-50"></div>
                  
                  <div className="text-center">
                    <span className="text-black text-lg font-bold uppercase tracking-wider">
                      YTD (Rev): 
                    </span>
                    <span className="text-black text-2xl font-black ml-2">
                      $2.1M
                    </span>
                  </div>
                  
                  {/* Separator line */}
                  <div className="w-24 h-0.5 bg-black opacity-50"></div>
                  
                  <div className="text-center">
                    <span className="text-black text-lg font-bold uppercase tracking-wider">
                      Best Week (Rev): 
                    </span>
                    <span className="text-black text-2xl font-black ml-2">
                      $47K
                    </span>
                  </div>
                </div>
                
                {/* Horizontal text on right side */}
                <div className="absolute right-4 top-1/2 transform -translate-y-1/2 flex flex-col items-end space-y-6">
                  <div className="text-right">
                    <span className="text-black text-lg font-bold uppercase tracking-wider">
                      Office: 
                    </span>
                    <span className="text-black text-2xl font-black ml-2">
                      Lancaster
                    </span>
                  </div>
                  
                  {/* Separator line */}
                  <div className="w-24 h-0.5 bg-black opacity-50"></div>
                  
                  <div className="text-right">
                    <span className="text-black text-lg font-bold uppercase tracking-wider">
                      Years Sold: 
                    </span>
                    <span className="text-black text-2xl font-black ml-2">
                      1,247
                    </span>
                  </div>
                  
                  {/* Separator line */}
                  <div className="w-24 h-0.5 bg-black opacity-50"></div>
                  
                  <div className="text-right">
                    <span className="text-black text-lg font-bold uppercase tracking-wider">
                      YTD (KW): 
                    </span>
                    <span className="text-black text-2xl font-black ml-2">
                      1,247
                    </span>
                  </div>
                  
                  {/* Separator line */}
                  <div className="w-24 h-0.5 bg-black opacity-50"></div>
                  
                  <div className="text-right">
                    <span className="text-black text-lg font-bold uppercase tracking-wider">
                      Best Week (KW): 
                    </span>
                    <span className="text-black text-2xl font-black ml-2">
                      47
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Box 5 - Top Team Baseball Card */}
            <div className="bg-gradient-to-br from-cyan-400 to-cyan-600 rounded-lg shadow-lg p-6 flex flex-col justify-center items-center h-[calc(50vh-5rem)] relative overflow-hidden">
              {/* Card title - outside border */}
              <h3 className="text-black text-3xl font-bold uppercase tracking-wider absolute top-2 left-1/2 transform -translate-x-1/2" style={{ WebkitTextFillColor: 'black', WebkitTextStroke: '1px black' }}>
                Top Rookie Setter
              </h3>
              {/* Inner baseball card - same shape as outer box */}
              <div className="bg-white rounded-lg border-2 border-white w-full h-full mt-8 flex flex-col justify-center items-center relative opacity-10">
                {/* Center text */}
                <div className="absolute left-1/2 top-1/2 transform -translate-y-1/2 flex flex-col items-center space-y-6">
                  <div className="text-center">
                    <span className="text-black text-lg font-bold uppercase tracking-wider">
                      Experience Level: 
                    </span>
                    <span className="text-black text-2xl font-black ml-2">
                      Rookie
                    </span>
                  </div>
                  
                  {/* Separator line */}
                  <div className="w-24 h-0.5 bg-black opacity-50"></div>
                  
                  <div className="text-center">
                    <span className="text-black text-lg font-bold uppercase tracking-wider">
                      Hometown: 
                    </span>
                    <span className="text-black text-2xl font-black ml-2">
                      N/A
                    </span>
                  </div>
                  
                  {/* Separator line */}
                  <div className="w-24 h-0.5 bg-black opacity-50"></div>
                  
                  <div className="text-center">
                    <span className="text-black text-lg font-bold uppercase tracking-wider">
                      YTD (Rev): 
                    </span>
                    <span className="text-black text-2xl font-black ml-2">
                      $2.1M
                    </span>
                  </div>
                  
                  {/* Separator line */}
                  <div className="w-24 h-0.5 bg-black opacity-50"></div>
                  
                  <div className="text-center">
                    <span className="text-black text-lg font-bold uppercase tracking-wider">
                      Best Week (Rev): 
                    </span>
                    <span className="text-black text-2xl font-black ml-2">
                      $47K
                    </span>
                  </div>
                </div>
                
                {/* Horizontal text on right side */}
                <div className="absolute right-4 top-1/2 transform -translate-y-1/2 flex flex-col items-end space-y-6">
                  <div className="text-right">
                    <span className="text-black text-lg font-bold uppercase tracking-wider">
                      Office: 
                    </span>
                    <span className="text-black text-2xl font-black ml-2">
                      Lancaster
                    </span>
                  </div>
                  
                  {/* Separator line */}
                  <div className="w-24 h-0.5 bg-black opacity-50"></div>
                  
                  <div className="text-right">
                    <span className="text-black text-lg font-bold uppercase tracking-wider">
                      Years Sold: 
                    </span>
                    <span className="text-black text-2xl font-black ml-2">
                      1,247
                    </span>
                  </div>
                  
                  {/* Separator line */}
                  <div className="w-24 h-0.5 bg-black opacity-50"></div>
                  
                  <div className="text-right">
                    <span className="text-black text-lg font-bold uppercase tracking-wider">
                      YTD (KW): 
                    </span>
                    <span className="text-black text-2xl font-black ml-2">
                      1,247
                    </span>
                  </div>
                  
                  {/* Separator line */}
                  <div className="w-24 h-0.5 bg-black opacity-50"></div>
                  
                  <div className="text-right">
                    <span className="text-black text-lg font-bold uppercase tracking-wider">
                      Best Week (KW): 
                    </span>
                    <span className="text-black text-2xl font-black ml-2">
                      47
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Box 6 - Top Company Baseball Card */}
            <div className="bg-gradient-to-br from-cyan-400 to-cyan-600 rounded-lg shadow-lg p-6 flex flex-col justify-center items-center h-[calc(50vh-5rem)] relative overflow-hidden">
              {/* Card title - outside border */}
              <h3 className="text-black text-3xl font-bold uppercase tracking-wider absolute top-2 left-1/2 transform -translate-x-1/2" style={{ WebkitTextFillColor: 'black', WebkitTextStroke: '1px black' }}>
                Top Setter
              </h3>
              {/* Inner baseball card - same shape as outer box */}
              <div className="bg-white rounded-lg border-2 border-white w-full h-full mt-8 flex flex-col justify-center items-center relative opacity-10">
                {/* Center text */}
                <div className="absolute left-1/2 top-1/2 transform -translate-y-1/2 flex flex-col items-center space-y-6">
                  <div className="text-center">
                    <span className="text-black text-lg font-bold uppercase tracking-wider">
                      Experience Level: 
                    </span>
                    <span className="text-black text-2xl font-black ml-2">
                      Pro
                    </span>
                  </div>
                  
                  {/* Separator line */}
                  <div className="w-24 h-0.5 bg-black opacity-50"></div>
                  
                  <div className="text-center">
                    <span className="text-black text-lg font-bold uppercase tracking-wider">
                      Hometown: 
                    </span>
                    <span className="text-black text-2xl font-black ml-2">
                      N/A
                    </span>
                  </div>
                  
                  {/* Separator line */}
                  <div className="w-24 h-0.5 bg-black opacity-50"></div>
                  
                  <div className="text-center">
                    <span className="text-black text-lg font-bold uppercase tracking-wider">
                      YTD (Rev): 
                    </span>
                    <span className="text-black text-2xl font-black ml-2">
                      $2.1M
                    </span>
                  </div>
                  
                  {/* Separator line */}
                  <div className="w-24 h-0.5 bg-black opacity-50"></div>
                  
                  <div className="text-center">
                    <span className="text-black text-lg font-bold uppercase tracking-wider">
                      Best Week (Rev): 
                    </span>
                    <span className="text-black text-2xl font-black ml-2">
                      $47K
                    </span>
                  </div>
                </div>
                
                {/* Horizontal text on right side */}
                <div className="absolute right-4 top-1/2 transform -translate-y-1/2 flex flex-col items-end space-y-6">
                  <div className="text-right">
                    <span className="text-black text-lg font-bold uppercase tracking-wider">
                      Office: 
                    </span>
                    <span className="text-black text-2xl font-black ml-2">
                      Lancaster
                    </span>
                  </div>
                  
                  {/* Separator line */}
                  <div className="w-24 h-0.5 bg-black opacity-50"></div>
                  
                  <div className="text-right">
                    <span className="text-black text-lg font-bold uppercase tracking-wider">
                      Years Sold: 
                    </span>
                    <span className="text-black text-2xl font-black ml-2">
                      1,247
                    </span>
                  </div>
                  
                  {/* Separator line */}
                  <div className="w-24 h-0.5 bg-black opacity-50"></div>
                  
                  <div className="text-right">
                    <span className="text-black text-lg font-bold uppercase tracking-wider">
                      YTD (KW): 
                    </span>
                    <span className="text-black text-2xl font-black ml-2">
                      1,247
                    </span>
                  </div>
                  
                  {/* Separator line */}
                  <div className="w-24 h-0.5 bg-black opacity-50"></div>
                  
                  <div className="text-right">
                    <span className="text-black text-lg font-bold uppercase tracking-wider">
                      Best Week (KW): 
                    </span>
                    <span className="text-black text-2xl font-black ml-2">
                      47
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Third row of boxes - Two 50/50 boxes */}
          <div className="grid grid-cols-2 gap-6 mb-6 mt-6">
            {/* Box 7 */}
            <div className="bg-gradient-to-br from-sky-600 to-sky-700 rounded-lg shadow-lg p-6 flex flex-col justify-center items-center h-[calc(50vh-5rem)] relative overflow-hidden">
              {/* Card title - outside border */}
              <h3 className="text-black text-3xl font-bold uppercase tracking-wider absolute top-2 left-1/2 transform -translate-x-1/2" style={{ WebkitTextFillColor: 'black', WebkitTextStroke: '1px black' }}>
                Top Closer (Month)
              </h3>
              {/* Inner baseball card - same shape as outer box */}
              <div className="bg-white rounded-lg border-2 border-white w-full h-full mt-8 flex flex-col justify-center items-center relative opacity-10">
                {/* Left column text */}
                <div className="absolute left-1/6 top-1/2 transform -translate-y-1/2 flex flex-col items-center space-y-6">
                  <div className="text-center">
                    <span className="text-black text-lg font-bold uppercase tracking-wider">
                      Experience Level: 
                    </span>
                    <span className="text-black text-2xl font-black ml-2">
                      Rookie
                    </span>
                  </div>
                  
                  {/* Separator line */}
                  <div className="w-24 h-0.5 bg-black opacity-50"></div>
                  
                  <div className="text-center">
                    <span className="text-black text-lg font-bold uppercase tracking-wider">
                      Hometown: 
                    </span>
                    <span className="text-black text-2xl font-black ml-2">
                      N/A
                    </span>
                  </div>
                  
                  {/* Separator line */}
                  <div className="w-24 h-0.5 bg-black opacity-50"></div>
                  
                  <div className="text-center">
                    <span className="text-black text-lg font-bold uppercase tracking-wider">
                      YTD (Rev): 
                    </span>
                    <span className="text-black text-2xl font-black ml-2">
                      $2.1M
                    </span>
                  </div>
                  
                  {/* Separator line */}
                  <div className="w-24 h-0.5 bg-black opacity-50"></div>
                  
                  <div className="text-center">
                    <span className="text-black text-lg font-bold uppercase tracking-wider">
                      Best Week (Rev): 
                    </span>
                    <span className="text-black text-2xl font-black ml-2">
                      $47K
                    </span>
                  </div>
                </div>
                
                {/* Middle column text */}
                <div className="absolute left-2/3 top-1/2 transform -translate-y-1/2 flex flex-col items-center space-y-6">
                  <div className="text-center">
                    <span className="text-black text-lg font-bold uppercase tracking-wider">
                      Experience Level: 
                    </span>
                    <span className="text-black text-2xl font-black ml-2">
                      Rookie
                    </span>
                  </div>
                  
                  {/* Separator line */}
                  <div className="w-24 h-0.5 bg-black opacity-50"></div>
                  
                  <div className="text-center">
                    <span className="text-black text-lg font-bold uppercase tracking-wider">
                      Hometown: 
                    </span>
                    <span className="text-black text-2xl font-black ml-2">
                      N/A
                    </span>
                  </div>
                  
                  {/* Separator line */}
                  <div className="w-24 h-0.5 bg-black opacity-50"></div>
                  
                  <div className="text-center">
                    <span className="text-black text-lg font-bold uppercase tracking-wider">
                      YTD (KW): 
                    </span>
                    <span className="text-black text-2xl font-black ml-2">
                      $2.1M
                    </span>
                  </div>
                  
                  {/* Separator line */}
                  <div className="w-24 h-0.5 bg-black opacity-50"></div>
                  
                  <div className="text-center">
                    <span className="text-black text-lg font-bold uppercase tracking-wider">
                      Best Week (KW): 
                    </span>
                    <span className="text-black text-2xl font-black ml-2">
                      $47K
                    </span>
                  </div>
                </div>
                
                {/* Horizontal text on right side */}
                <div className="absolute right-4 top-1/2 transform -translate-y-1/2 flex flex-col items-end space-y-6">
                  <div className="text-right">
                    <span className="text-black text-lg font-bold uppercase tracking-wider">
                      Favorite Lender: 
                    </span>
                    <span className="text-black text-2xl font-black ml-2">
                      Data 1
                    </span>
                  </div>
                  {/* Separator line */}
                  <div className="w-24 h-0.5 bg-black opacity-50"></div>
                  <div className="text-right">
                    <span className="text-black text-lg font-bold uppercase tracking-wider">
                      Favorite Panel: 
                    </span>
                    <span className="text-black text-2xl font-black ml-2">
                      Data 2
                    </span>
                  </div>
                  {/* Separator line */}
                  <div className="w-24 h-0.5 bg-black opacity-50"></div>
                  <div className="text-right">
                    <span className="text-black text-lg font-bold uppercase tracking-wider">
                      AVG DEAL (KW): 
                    </span>
                    <span className="text-black text-2xl font-black ml-2">
                      Data 3
                    </span>
                  </div>
                  {/* Separator line */}
                  <div className="w-24 h-0.5 bg-black opacity-50"></div>
                  <div className="text-right">
                    <span className="text-black text-lg font-bold uppercase tracking-wider">
                      AVG DEAL (REV): 
                    </span>
                    <span className="text-black text-2xl font-black ml-2">
                      Data 4
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Box 8 */}
            <div className="bg-gradient-to-br from-sky-600 to-sky-700 rounded-lg shadow-lg p-6 flex flex-col justify-center items-center h-[calc(50vh-5rem)] relative overflow-hidden">
              {/* Card title - outside border */}
              <h3 className="text-black text-3xl font-bold uppercase tracking-wider absolute top-2 left-1/2 transform -translate-x-1/2" style={{ WebkitTextFillColor: 'black', WebkitTextStroke: '1px black' }}>
                Top Closer (Year)
              </h3>
              {/* Inner baseball card - same shape as outer box */}
              <div className="bg-white rounded-lg border-2 border-white w-full h-full mt-8 flex flex-col justify-center items-center relative opacity-10">
                {/* Left column text */}
                <div className="absolute left-1/6 top-1/2 transform -translate-y-1/2 flex flex-col items-center space-y-6">
                  <div className="text-center">
                    <span className="text-black text-lg font-bold uppercase tracking-wider">
                      Experience Level: 
                    </span>
                    <span className="text-black text-2xl font-black ml-2">
                      Rookie
                    </span>
                  </div>
                  
                  {/* Separator line */}
                  <div className="w-24 h-0.5 bg-black opacity-50"></div>
                  
                  <div className="text-center">
                    <span className="text-black text-lg font-bold uppercase tracking-wider">
                      Hometown: 
                    </span>
                    <span className="text-black text-2xl font-black ml-2">
                      N/A
                    </span>
                  </div>
                  
                  {/* Separator line */}
                  <div className="w-24 h-0.5 bg-black opacity-50"></div>
                  
                  <div className="text-center">
                    <span className="text-black text-lg font-bold uppercase tracking-wider">
                      YTD (Rev): 
                    </span>
                    <span className="text-black text-2xl font-black ml-2">
                      $2.1M
                    </span>
                  </div>
                  
                  {/* Separator line */}
                  <div className="w-24 h-0.5 bg-black opacity-50"></div>
                  
                  <div className="text-center">
                    <span className="text-black text-lg font-bold uppercase tracking-wider">
                      Best Week (Rev): 
                    </span>
                    <span className="text-black text-2xl font-black ml-2">
                      $47K
                    </span>
                  </div>
                </div>
                
                {/* Middle column text */}
                <div className="absolute left-2/3 top-1/2 transform -translate-y-1/2 flex flex-col items-center space-y-6">
                  <div className="text-center">
                    <span className="text-black text-lg font-bold uppercase tracking-wider">
                      Experience Level: 
                    </span>
                    <span className="text-black text-2xl font-black ml-2">
                      Rookie
                    </span>
                  </div>
                  
                  {/* Separator line */}
                  <div className="w-24 h-0.5 bg-black opacity-50"></div>
                  
                  <div className="text-center">
                    <span className="text-black text-lg font-bold uppercase tracking-wider">
                      Hometown: 
                    </span>
                    <span className="text-black text-2xl font-black ml-2">
                      N/A
                    </span>
                  </div>
                  
                  {/* Separator line */}
                  <div className="w-24 h-0.5 bg-black opacity-50"></div>
                  
                  <div className="text-center">
                    <span className="text-black text-lg font-bold uppercase tracking-wider">
                      YTD (KW): 
                    </span>
                    <span className="text-black text-2xl font-black ml-2">
                      $2.1M
                    </span>
                  </div>
                  
                  {/* Separator line */}
                  <div className="w-24 h-0.5 bg-black opacity-50"></div>
                  
                  <div className="text-center">
                    <span className="text-black text-lg font-bold uppercase tracking-wider">
                      Best Week (KW): 
                    </span>
                    <span className="text-black text-2xl font-black ml-2">
                      $47K
                    </span>
                  </div>
                </div>
                
                {/* Horizontal text on right side */}
                <div className="absolute right-4 top-1/2 transform -translate-y-1/2 flex flex-col items-end space-y-6">
                  <div className="text-right">
                    <span className="text-black text-lg font-bold uppercase tracking-wider">
                      Favorite Lender: 
                    </span>
                    <span className="text-black text-2xl font-black ml-2">
                      Data 1
                    </span>
                  </div>
                  {/* Separator line */}
                  <div className="w-24 h-0.5 bg-black opacity-50"></div>
                  <div className="text-right">
                    <span className="text-black text-lg font-bold uppercase tracking-wider">
                      Favorite Panel: 
                    </span>
                    <span className="text-black text-2xl font-black ml-2">
                      Data 2
                    </span>
                  </div>
                  {/* Separator line */}
                  <div className="w-24 h-0.5 bg-black opacity-50"></div>
                  <div className="text-right">
                    <span className="text-black text-lg font-bold uppercase tracking-wider">
                      AVG DEAL (KW): 
                    </span>
                    <span className="text-black text-2xl font-black ml-2">
                      Data 3
                    </span>
                  </div>
                  {/* Separator line */}
                  <div className="w-24 h-0.5 bg-black opacity-50"></div>
                  <div className="text-right">
                    <span className="text-black text-lg font-bold uppercase tracking-wider">
                      AVG DEAL (REV): 
                    </span>
                    <span className="text-black text-2xl font-black ml-2">
                      Data 4
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Wide bottom box */}
          <div className="bg-cyan-500 rounded-lg shadow p-8 flex flex-col justify-between h-[calc(50vh-5rem)]">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <div className="bg-black bg-opacity-10 p-4 rounded-full">
                  <svg className="h-8 w-8 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                </div>
                <div className="ml-4">
                  <h3 className="text-black text-3xl font-bold" style={{ WebkitTextFillColor: 'black', WebkitTextStroke: '1px black' }}>System Status</h3>
                  <p className="text-3xl font-bold text-black" style={{ WebkitTextFillColor: 'black', WebkitTextStroke: '1px black' }}>All Systems Operational</p>
                </div>
              </div>
            </div>
            <div className="mt-2">
              <a href="/status" className="text-base text-black hover:underline font-bold" style={{ WebkitTextFillColor: 'black', WebkitTextStroke: '1px black' }}>View system details →</a>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
} 
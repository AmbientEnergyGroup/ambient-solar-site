"use client";

import React, { useState, useEffect } from 'react';
import MessagesButton from "@/components/MessagesButton";

import { useRouter } from 'next/navigation';
import { useTheme } from "@/lib/hooks/useTheme";
import Sidebar from "@/components/Sidebar";
import AmbientLogo from "@/components/AmbientLogo";
import { useAuth } from "@/lib/hooks/useAuth";
import { 
  BarChart, 
  Calendar, 
  ChevronLeft, 
  ChevronRight, 
  CheckCircle, 
  CreditCard, 
  Download, 
  Filter, 
  Home, 
  Menu, 
  Printer,
  DollarSign
} from 'lucide-react';

interface CommissionPayment {
  amount: number;
  date: string;
  projectId: string;
  description: string;
  status: 'pending' | 'paid';
  customerName: string;
  dealNumber: number;
  systemSize: number;
  commissionRate: number;
}

export default function HRPage() {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { darkMode, toggleTheme } = useTheme();
  const { user, userData, loading, signOut } = useAuth();
  const [commissionPayments, setCommissionPayments] = useState<CommissionPayment[]>([]);
  const [nextPayment, setNextPayment] = useState<CommissionPayment | null>(null);
  const [paymentHistory, setPaymentHistory] = useState<CommissionPayment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalPending, setTotalPending] = useState(0);

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Load commission data
  useEffect(() => {
    // Set a timeout to prevent infinite loading
    const timer = setTimeout(() => {
      if (isLoading) {
        setIsLoading(false);
      }
    }, 2000);

    console.log("HR loading, userData:", userData);

    if (userData) {
      // Check if userData has commissionPayments property
      const payments = (userData as any).commissionPayments || [];
      console.log("Commission payments found:", payments);
      
      // Sort payments by date
      const sortedPayments = [...payments].sort((a, b) => {
        return new Date(a.date).getTime() - new Date(b.date).getTime();
      });
      
      setCommissionPayments(sortedPayments);
      
      // Set next payment (first pending payment)
      const pendingPayments = sortedPayments.filter(p => p.status === 'pending');
      setNextPayment(pendingPayments.length > 0 ? pendingPayments[0] : null);
      
      // Set payment history (paid payments)
      const paidPayments = sortedPayments.filter(p => p.status === 'paid');
      setPaymentHistory(paidPayments);
      
      // Calculate total pending amount
      const total = pendingPayments.reduce((sum, payment) => sum + payment.amount, 0);
      setTotalPending(total);
      
      setIsLoading(false);
    } else if (!loading) {
      // If userData is undefined but auth loading is complete, exit loading state
      setIsLoading(false);
    }

    return () => clearTimeout(timer);
  }, [userData, loading, isLoading]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen theme-bg-primary">
        <div className={`animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 ${darkMode ? 'border-amber-500' : 'border-blue-500'}`}></div>
      </div>
    );
  }

  return (
    <div className="flex h-screen theme-bg-primary overflow-hidden">
      {/* Sidebar */}
      <Sidebar 
        darkMode={darkMode}
        signOut={signOut}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col theme-bg-secondary overflow-hidden">
        <header className="theme-bg-secondary shadow-sm border-b theme-border-primary">
          <div className="px-6 py-4 flex items-center">
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
              <div className="absolute left-1/2 top-4 transform -translate-x-1/2 flex items-center">
                <AmbientLogo theme={darkMode ? 'dark' : 'light'} size="xl" />
              </div>
            )}

            <div className={`${sidebarOpen ? 'ml-4' : 'ml-auto'} flex-1`}>
              <div className="flex justify-between items-center">
                {sidebarOpen && (
                  <>
                    <h1 className="text-2xl font-bold theme-text-primary">HR</h1>
                    <button 
                      onClick={() => {
                        // Create sample commission payment for testing
                        if (user) {
                          const userDataKey = `userData_${user.uid}`;
                          const storedUserData = localStorage.getItem(userDataKey);
                          
                          if (storedUserData) {
                            const userData = JSON.parse(storedUserData);
                            
                            // Initialize commissionPayments array if it doesn't exist
                            if (!userData.commissionPayments) {
                              userData.commissionPayments = [];
                            }
                            
                            // Add a test commission payment
                            const today = new Date();
                            const nextFriday = new Date(today);
                            const daysUntilFriday = (5 + 7 - today.getDay()) % 7;
                            nextFriday.setDate(today.getDate() + daysUntilFriday + 7);
                            
                            userData.commissionPayments.push({
                              amount: 1200,
                              date: nextFriday.toISOString().split('T')[0],
                              projectId: "test-123",
                              description: "Test Commission for Jones Family - 6kW system",
                              status: 'pending',
                              customerName: "Jones Family",
                              dealNumber: 1,
                              systemSize: 6,
                              commissionRate: 200
                            });
                            
                            // Store updated user data
                            localStorage.setItem(userDataKey, JSON.stringify(userData));
                            
                            alert("Added test commission payment. Refresh the page to see it.");
                            console.log("Added test commission payment:", userData.commissionPayments);
                          }
                        }
                      }}
                      className="px-3 py-1 text-xs theme-bg-quaternary rounded-md theme-text-primary"
                    >
                      Add Test Data
                    </button>
                  </>
                )}
              </div>
              {sidebarOpen && (
                <p className="theme-text-tertiary text-sm">Review your earnings</p>
              )}
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-auto theme-bg-secondary">
          <div className="p-6">
            {/* Payment controls */}
            <div className="mb-6 flex items-center justify-end space-x-3">
              
              <button className={`${darkMode ? 'bg-amber-500 hover:bg-amber-600' : 'bg-blue-500 hover:bg-blue-600'} px-4 py-2 rounded-md text-white font-medium flex items-center`}>
                <Download className="h-4 w-4 mr-2" />
                Download PDF
              </button>
            </div>

            {/* Next Payment Card */}
            <div className="mb-8 theme-bg-tertiary rounded-lg shadow-sm theme-border-primary border overflow-hidden">
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold theme-text-primary">Next Payment</h2>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${darkMode ? 'bg-amber-500 bg-opacity-10 text-amber-500' : 'bg-blue-500 bg-opacity-10 text-blue-500'}`}>
                    {nextPayment ? 'Pending' : 'No Pending Payments'}
                  </span>
                </div>
                
                {nextPayment ? (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div>
                        <span className="block text-sm theme-text-secondary mb-1">Amount</span>
                        <span className="text-3xl font-bold theme-text-primary">{formatCurrency(totalPending)}</span>
                      </div>
                      <div>
                        <span className="block text-sm theme-text-secondary mb-1">Payment Date</span>
                        <span className="text-lg font-medium theme-text-primary flex items-center">
                          <Calendar className="h-4 w-4 mr-2" />
                          {formatDate(nextPayment.date)}
                        </span>
                      </div>
                      <div>
                        <span className="block text-sm theme-text-secondary mb-1">Payment Method</span>
                        <span className="text-lg font-medium theme-text-primary flex items-center">
                          <CreditCard className="h-4 w-4 mr-2" />
                          Direct Deposit
                        </span>
                      </div>
                    </div>
                    
                    <div className="mt-6 pt-6 border-t theme-border-primary">
                      <h3 className="font-medium theme-text-primary mb-3">Payment Breakdown</h3>
                      <div className="space-y-3">
                        {commissionPayments
                          .filter(payment => payment.status === 'pending')
                          .map((payment, index) => (
                            <div key={index} className="flex justify-between items-center">
                              <span className="theme-text-primary">{payment.description}</span>
                              <span className="font-medium theme-text-primary">{formatCurrency(payment.amount)}</span>
                            </div>
                          ))
                        }
                        
                        <div className="flex justify-between items-center pt-2 border-t theme-border-primary">
                          <span className="font-medium theme-text-primary">Total Amount</span>
                          <span className="font-bold text-lg theme-text-primary">{formatCurrency(totalPending)}</span>
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="py-8 text-center theme-text-secondary">
                    <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-20" />
                    <p>You don't have any pending payments.</p>
                    <p className="mt-2 text-sm">Completed sets will appear here when ready for payment.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Payment History */}
            <div className="theme-bg-tertiary rounded-lg shadow-sm theme-border-primary border overflow-hidden">
              <div className="p-6">
                <h2 className="text-xl font-semibold theme-text-primary mb-6">Payment History</h2>
                
                {paymentHistory.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full">
                      <thead>
                        <tr className="border-b theme-border-primary">
                          <th className="text-left py-3 px-4 theme-text-secondary">Date</th>
                          <th className="text-left py-3 px-4 theme-text-secondary">Amount</th>
                          <th className="text-left py-3 px-4 theme-text-secondary">Customer</th>
                          <th className="text-left py-3 px-4 theme-text-secondary">Deal</th>
                          <th className="text-left py-3 px-4 theme-text-secondary">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {paymentHistory.map((payment, index) => (
                          <tr key={index} className="border-b theme-border-primary hover:theme-bg-quaternary">
                            <td className="py-4 px-4 theme-text-primary">{formatDate(payment.date)}</td>
                            <td className="py-4 px-4 theme-text-primary font-medium">{formatCurrency(payment.amount)}</td>
                            <td className="py-4 px-4 theme-text-primary">{payment.customerName}</td>
                            <td className="py-4 px-4 theme-text-primary">#{payment.dealNumber}</td>
                            <td className="py-4 px-4">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Paid
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-8 theme-text-secondary">
                    <BarChart className="h-12 w-12 mx-auto mb-4 opacity-20" />
                    <p>You don't have any payment history yet.</p>
                    <p className="mt-2 text-sm">Completed payments will appear here.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 
"use client";

import { useState, useEffect } from "react";
import MessagesButton from "@/components/MessagesButton";

import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/contexts/AuthContext";
import { useTheme } from "@/lib/hooks/useTheme";
import { BarChart3, Users, LogOut, Home, Map, Check, UserPlus } from "lucide-react";
import AmbientLogo from "@/components/AmbientLogo";
import Sidebar from "@/components/Sidebar";

export default function RecruitingForm() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { darkMode } = useTheme();
  const [formData, setFormData] = useState({
    referralName: "",
    referralEmail: "",
    referralPhone: "",
    relationship: "Friend",
    experience: "None",
    reason: ""
  });
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const auth = useAuth();
  const { user, loading, signOut } = auth || {};
  const router = useRouter();

  // Theme is now managed globally by useTheme hook

  // Redirect to home if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push("/");
    }
  }, [user, loading, router]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      try {
        // Get existing referrals or initialize with empty array
        const existingReferrals = localStorage.getItem('referrals');
        const referrals = existingReferrals ? JSON.parse(existingReferrals) : [];
        
        // Add new referral with pending status
        referrals.push({
          ...formData,
          date: new Date().toISOString(),
          status: 'Pending',
          referredBy: user?.displayName || user?.email || 'Unknown User'
        });
        
        // Save back to localStorage
        localStorage.setItem('referrals', JSON.stringify(referrals));
        
        setIsLoading(false);
        setIsSubmitted(true);
      } catch (error) {
        console.error("Error submitting referral:", error);
        setIsLoading(false);
        // You could add error handling UI here
      }
    }, 1000);
  };

  const handleNewReferral = () => {
    setFormData({
      referralName: "",
      referralEmail: "",
      referralPhone: "",
      relationship: "Friend",
      experience: "None",
      reason: ""
    });
    setIsSubmitted(false);
  };

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen theme-bg-primary">
        <div className={`animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 ${darkMode ? 'border-cyan-500' : 'border-cyan-500'}`}></div>
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
        <header className="theme-bg-secondary shadow-sm border-b theme-border-primary">
          <div className="px-6 py-4 flex items-center">
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

            {/* Centered logo when sidebar is closed */}
            {!sidebarOpen && (
              <div className="absolute left-1/2 top-4 transform -translate-x-1/2 flex items-center">
                <AmbientLogo theme={darkMode ? 'dark' : 'light'} size="xl" />
              </div>
            )}

            <div className={`${sidebarOpen ? 'ml-4' : 'ml-auto'}`}>
              {sidebarOpen && (
                <>
                  <h1 className="text-2xl font-semibold theme-text-primary">Recruiting Form</h1>
                  <p className="theme-text-secondary">Refer a friend to join our sales team</p>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Form content */}
        <div className="p-6 max-w-3xl mx-auto">
          {isSubmitted ? (
            <div className="theme-bg-tertiary p-8 rounded-xl shadow-lg text-center border theme-border-primary">
              <div className="w-16 h-16 rounded-full bg-green-900 bg-opacity-25 mx-auto flex items-center justify-center mb-4">
                <Check className={`h-8 w-8 ${darkMode ? 'text-green-500' : 'text-green-600'}`} />
              </div>
              <h2 className="text-2xl font-bold theme-text-primary mb-2">Referral Submitted!</h2>
              <p className="theme-text-secondary text-lg mb-6">
                Thank you for referring your friend. Our recruiting team will review their information and reach out to them soon.
              </p>
              <button 
                onClick={handleNewReferral}
                className={`px-6 py-3 rounded-xl font-medium ${darkMode ? 'bg-cyan-500 text-white hover:bg-cyan-600' : 'bg-cyan-500 text-white hover:bg-cyan-600'} transition-colors`}
              >
                Submit Another Referral
              </button>
            </div>
          ) : (
            <div className="theme-bg-tertiary rounded-xl shadow-lg border theme-border-primary overflow-hidden">
              <div className="px-6 py-4 bg-gradient-to-r from-gray-750 to-gray-800 border-b theme-border-primary">
                <h2 className="text-xl font-semibold theme-text-primary flex items-center gap-2">
                  <UserPlus className={`h-6 w-6 ${darkMode ? 'text-cyan-500' : 'text-cyan-500'}`} />
                  <span>Refer a Friend</span>
                </h2>
              </div>
              
              <form onSubmit={handleSubmit} className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Referral Name */}
                  <div>
                    <label className="block mb-2 text-sm font-medium theme-text-secondary">Friend's Full Name*</label>
                    <input 
                      type="text" 
                      name="referralName" 
                      value={formData.referralName}
                      onChange={handleInputChange}
                      required
                      className="p-3 w-full bg-black border border-gray-600 rounded-xl text-white focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all"
                      placeholder="John Doe"
                    />
                  </div>
                  
                  {/* Referral Email */}
                  <div>
                    <label className="block mb-2 text-sm font-medium theme-text-secondary">Friend's Email*</label>
                    <input 
                      type="email" 
                      name="referralEmail" 
                      value={formData.referralEmail}
                      onChange={handleInputChange}
                      required
                      className="p-3 w-full bg-black border border-gray-600 rounded-xl text-white focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all"
                      placeholder="john.doe@example.com"
                    />
                  </div>
                  
                  {/* Referral Phone */}
                  <div>
                    <label className="block mb-2 text-sm font-medium theme-text-secondary">Friend's Phone Number*</label>
                    <input 
                      type="tel" 
                      name="referralPhone" 
                      value={formData.referralPhone}
                      onChange={handleInputChange}
                      required
                      className="p-3 w-full bg-black border border-gray-600 rounded-xl text-white focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all"
                      placeholder="(555) 123-4567"
                    />
                  </div>
                  
                  {/* Relationship */}
                  <div>
                    <label className="block mb-2 text-sm font-medium theme-text-secondary">How do you know them?*</label>
                    <select 
                      name="relationship"
                      value={formData.relationship}
                      onChange={handleInputChange}
                      required
                      className="p-3 w-full bg-black border border-gray-600 rounded-xl text-white focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all"
                    >
                      <option value="Friend">Friend</option>
                      <option value="Family">Family Member</option>
                      <option value="Colleague">Former Colleague</option>
                      <option value="Classmate">Former Classmate</option>
                      <option value="Acquaintance">Acquaintance</option>
                    </select>
                  </div>
                  
                  {/* Experience */}
                  <div className="md:col-span-2">
                    <label className="block mb-2 text-sm font-medium theme-text-secondary">Previous Sales Experience*</label>
                    <select 
                      name="experience"
                      value={formData.experience}
                      onChange={handleInputChange}
                      required
                      className="p-3 w-full bg-black border border-gray-600 rounded-xl text-white focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all"
                    >
                      <option value="None">No Previous Experience</option>
                      <option value="Some">Some Experience (Less than 1 year)</option>
                      <option value="Moderate">Moderate Experience (1-3 years)</option>
                      <option value="Experienced">Experienced (3+ years)</option>
                    </select>
                  </div>
                  
                  {/* Why they'd be a good fit */}
                  <div className="md:col-span-2">
                    <label className="block mb-2 text-sm font-medium theme-text-secondary">Why would they be a good fit for our team?*</label>
                    <textarea 
                      name="reason"
                      value={formData.reason}
                      onChange={handleInputChange}
                      required
                      rows={4}
                      className="p-3 w-full bg-black border border-gray-600 rounded-xl text-white focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all"
                      placeholder="Tell us why you think your friend would be a good addition to our sales team..."
                    ></textarea>
                  </div>
                </div>
                
                <div className="mt-8 flex justify-end">
                  <button 
                    type="submit"
                    disabled={isLoading}
                    className={`px-6 py-3 rounded-xl font-medium ${darkMode ? 'bg-cyan-500 text-white hover:bg-cyan-600' : 'bg-cyan-500 text-white hover:bg-cyan-600'} transition-colors flex items-center gap-2 disabled:opacity-50`}
                  >
                    {isLoading ? (
                      <>
                        <span className="h-4 w-4 border-2 border-t-transparent rounded-full animate-spin"></span>
                        <span>Submitting...</span>
                      </>
                    ) : (
                      'Submit Referral'
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 
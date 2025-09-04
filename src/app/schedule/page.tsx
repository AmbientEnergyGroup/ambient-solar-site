"use client";

import { useState, useEffect } from "react";
import MessagesButton from "@/components/MessagesButton";

import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/contexts/AuthContext";
import { Calendar, Clock, Plus, List, ChevronLeft, ChevronRight, User, Home, Phone, X, Check } from "lucide-react";
import AmbientLogo from "@/components/AmbientLogo";
import Sidebar from "@/components/Sidebar";
import { useTheme } from "@/lib/hooks/useTheme";
import ClientOnly from "@/components/ClientOnly";
import CloserAssignmentModal from "@/components/CloserAssignmentModal";
import { 
  getUserSets, 
  getCloserSets, 
  subscribeToUserSets, 
  subscribeToCloserSets,
  CustomerSet 
} from "@/lib/firebase/firebaseUtils";

// Use CustomerSet from firebaseUtils, but extend status to include all possible values
interface ScheduleSet extends Omit<CustomerSet, 'status'> {
  status?: "active" | "not_closed" | "closed" | "assigned" | "inactive";
}

// Define the Project interface (simplified version)
interface Project {
  id: string;
  customerName: string;
  address: string;
  systemSize: string;
  grossPPW: string;
  financeType: string;
  lender: string;
  adders: string[];
  installDate?: string;
  paymentDate?: string;
  siteSurveyDate?: string;
  siteSurveyTime?: string;
  permitDate?: string;
  inspectionDate?: string;
  ptoDate?: string;
  paymentAmount: number;
  status: "site_survey" | "permit" | "install" | "inspection" | "pto" | "completed" | "cancelled";
  batteryType?: string;
  batteryQuantity?: number;
  panelType?: string;
  userId: string;
  commissionRate: number;
  dealNumber: number;
  createdAt: string;
  utilityBill?: string;
}

export default function Schedule() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [currentMonthTimestamp, setCurrentMonthTimestamp] = useState(0); // 0 as initial value
  const [selectedDateTimestamp, setSelectedDateTimestamp] = useState<number | null>(null);
  const [sets, setSets] = useState<ScheduleSet[]>([]);
  const [closers, setClosers] = useState<{id: string, name: string}[]>([]);
  const [selectedCloser, setSelectedCloser] = useState<string>("all");
  const [showDocumentsModal, setShowDocumentsModal] = useState(false);
  const [selectedSetDocuments, setSelectedSetDocuments] = useState<ScheduleSet | null>(null);
  const [isClient, setIsClient] = useState(false);
  
  // Closer assignment modal state
  const [showCloserAssignmentModal, setShowCloserAssignmentModal] = useState(false);
  const [selectedSetForAssignment, setSelectedSetForAssignment] = useState<ScheduleSet | null>(null);
  
  // Computed Date objects from timestamps (only used client-side)
  const currentMonth = isClient ? new Date(currentMonthTimestamp) : new Date(0);
  const selectedDate = selectedDateTimestamp ? new Date(selectedDateTimestamp) : null;
  
  // Added variables for the "closed" functionality
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [currentSetId, setCurrentSetId] = useState<string | null>(null);
  const [isClosedVerified, setIsClosedVerified] = useState(false);
  const [closeFormData, setCloseFormData] = useState({
    customerName: "",
    systemSize: "",
    grossPPW: "",
    adders: [] as string[],
    lender: "",
    financeType: "",
    panelType: "",
    siteSurveyDate: "",
    siteSurveyTime: "",
    permitDate: "",
    installDate: "",
    inspectionDate: "",
    ptoDate: "",
    paymentDate: "",
    batteryType: "",
    batteryQuantity: "0"
  });
  
  const auth = useAuth();
  const { user, userData, loading, signOut } = auth || {};
  const router = useRouter();
  const { darkMode } = useTheme();

  // Helper functions for role-based permissions
  const isManager = () => {
    return userData?.role === 'manager' || user?.role === 'manager';
  };

  const isCloser = () => {
    return userData?.role === 'closer' || user?.role === 'closer';
  };

  const isSetter = () => {
    return userData?.role === 'setter' || user?.role === 'setter';
  };
  
  // Redirect setters away from this page
  useEffect(() => {
    if (!loading && user && isSetter() && !isCloser()) {
      // Redirect setters to dashboard since they don't have access
      window.location.href = '/dashboard';
    }
  }, [loading, user]);

  const canViewFullDetails = (set: ScheduleSet) => {
    // Managers can view all details
    if (isManager()) return true;
    
    // Closers can view full details of their own appointments
    if (isCloser() && set.closerId === user?.uid) return true;
    
    // Setters can view full details of their own appointments
    if (isSetter() && set.userId === user?.uid) return true;
    
    return false;
  };

  const canCompleteSet = (set: ScheduleSet) => {
    // Allow closers to complete their assigned sets
    if (isCloser() && set.closerId === user?.uid) {
      return true;
    }
    
    // Allow managers to complete any set
    if (isManager()) {
      return true;
    }
    
    // Allow setters to complete their own sets
    if (isSetter() && set.userId === user?.uid) {
      return true;
    }
    
    return false;
  };

  // Filter sets based on user role and permissions
  const getFilteredSets = () => {
    if (isManager()) {
      // Managers can see all sets
      return sets;
    } else if (isCloser()) {
      // Closers can see their own appointments with full details
      // and other closers' appointments with limited details
      return sets.map(set => {
        if (set.closerId === user?.uid) {
          return set; // Full details for own appointments
        } else {
          // Limited details for other closers' appointments
          return {
            ...set,
            customerName: 'Appointment Scheduled',
            address: 'Address Hidden',
            phoneNumber: 'Phone Hidden',
            notes: 'Notes Hidden'
          };
        }
      });
    } else if (isSetter()) {
      // Setters can see their own appointments with full details
      // and other appointments with limited details
      return sets.map(set => {
        if (set.userId === user?.uid) {
          return set; // Full details for own appointments
        } else {
          // Limited details for other appointments
          return {
            ...set,
            customerName: 'Appointment Scheduled',
            address: 'Address Hidden',
            phoneNumber: 'Phone Hidden',
            notes: 'Notes Hidden'
          };
        }
      });
    }
    
    return sets;
  };

  // Add useEffect to handle client-side initialization
  useEffect(() => {
    console.log('Schedule page: Client-side initialization starting');
    setIsClient(true);
    // Update the date to current date on client-side
    setCurrentMonthTimestamp(new Date().getTime());
    
    // Set up real-time subscription to user's sets
    if (user?.uid) {
      console.log('Schedule page: Setting up real-time subscription for user:', user.uid);
      
      let unsubscribe: (() => void) | null = null;
      
      if (isCloser()) {
        // Closers see their assigned sets
        unsubscribe = subscribeToCloserSets(user.uid, (assignedSets) => {
          console.log('Schedule page: Received assigned sets from Firestore:', assignedSets.length);
          setSets(assignedSets);
        });
      } else {
        // Setters see their own sets
        unsubscribe = subscribeToUserSets(user.uid, (userSets) => {
          console.log('Schedule page: Received user sets from Firestore:', userSets.length);
          setSets(userSets);
        });
      }
      
      return () => {
        if (unsubscribe) unsubscribe();
      };
    }
    console.log('Schedule page: Client-side initialization complete');
  }, []);

  // Redirect to home if not authenticated
  useEffect(() => {
    console.log('Schedule page: Auth check - loading:', loading, 'user:', user);
    if (!loading && !user) {
      console.log('Schedule page: No user found, redirecting to home');
      router.push("/");
    } else if (user) {
      console.log('Schedule page: User authenticated:', user.email);
      // Load closers from Firebase if user has a region
      if (userData?.region) {
        loadClosersForRegion(userData.region);
      }
    }
  }, [user, loading, router]);

  // Change month
  const changeMonth = (increment: number) => {
    if (!currentMonth) return;
    const newMonth = new Date(currentMonth);
    newMonth.setMonth(newMonth.getMonth() + increment);
    setCurrentMonthTimestamp(newMonth.getTime());
  };

  // Select a date
  const handleSelectDate = (date: Date) => {
    setSelectedDateTimestamp(date.getTime());
  };

  // Generate calendar days
  const generateCalendarDays = () => {
    console.log('Schedule page: Generating calendar days - isClient:', isClient, 'currentMonth:', currentMonth);
    if (!isClient || !currentMonth) {
      // Return empty array on server or if currentMonth is not set
      console.log('Schedule page: Returning empty calendar days array');
      return [];
    }
    
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    
    // First day of the month
    const firstDay = new Date(year, month, 1);
    // Last day of the month
    const lastDay = new Date(year, month + 1, 0);
    
    // Get the day of the week of the first day (0 = Sunday, 6 = Saturday)
    const startDayOfWeek = firstDay.getDay();
    // Total days in the month
    const daysInMonth = lastDay.getDate();
    
    // Previous month's days to show
    const prevMonthDays = [];
    if (startDayOfWeek > 0) {
      const prevMonth = new Date(year, month, 0);
      const prevMonthLastDay = prevMonth.getDate();
      
      for (let i = prevMonthLastDay - startDayOfWeek + 1; i <= prevMonthLastDay; i++) {
        prevMonthDays.push({
          date: new Date(year, month - 1, i),
          isCurrentMonth: false
        });
      }
    }
    
    // Current month's days
    const currentMonthDays = [];
    for (let i = 1; i <= daysInMonth; i++) {
      currentMonthDays.push({
        date: new Date(year, month, i),
        isCurrentMonth: true
      });
    }
    
    // Next month's days to show
    const nextMonthDays = [];
    const totalDaysShown = prevMonthDays.length + currentMonthDays.length;
    const remainingDays = 42 - totalDaysShown; // 6 rows of 7 days each
    
    for (let i = 1; i <= remainingDays; i++) {
      nextMonthDays.push({
        date: new Date(year, month + 1, i),
        isCurrentMonth: false
      });
    }
    
    return [...prevMonthDays, ...currentMonthDays, ...nextMonthDays];
  };

  // Format date for display
  const formatDate = (date: Date) => {
    if (!date) return '';
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  // Check if a date has appointments
  const hasAppointments = (date: Date) => {
    if (!date) return false;
    const dateString = date.toISOString().split('T')[0];
    
    return getFilteredSets().some(set => {
      return set.appointmentDate === dateString;
    });
  };

  // Get appointments for selected date
  const getAppointmentsForDate = (date: Date) => {
    if (!date) return [];
    
    const dateString = date.toISOString().split('T')[0];
    
    return getFilteredSets().filter(set => set.appointmentDate === dateString);
  };

  // Filter sets based on selected closer and role permissions
  const getFilteredSetsByCloser = () => {
    const roleFilteredSets = getFilteredSets();
    return roleFilteredSets.filter(set => {
      if (selectedCloser === "all") return true;
      return set.closerId === selectedCloser;
    });
  };

  // Format time for display
  const formatTime = (timeString: string) => {
    try {
      const [hours, minutes] = timeString.split(':');
      const hour = parseInt(hours, 10);
      const minute = parseInt(minutes, 10);
      
      let period = 'AM';
      let formattedHour = hour;
      
      if (hour >= 12) {
        period = 'PM';
        formattedHour = hour === 12 ? 12 : hour - 12;
      }
      if (formattedHour === 0) {
        formattedHour = 12;
      }
      
      return `${formattedHour}:${minute.toString().padStart(2, '0')} ${period}`;
    } catch (error) {
      return timeString; // Return original if parsing fails
    }
  };

  // Handle viewing documents
  const handleViewDocuments = (set: ScheduleSet) => {
    setSelectedSetDocuments(set);
    setShowDocumentsModal(true);
  };

  // Handle closer assignment
  const handleAssignCloser = (set: ScheduleSet) => {
    setSelectedSetForAssignment(set);
    setShowCloserAssignmentModal(true);
  };

  // Load closers for a specific region
  const loadClosersForRegion = async (region: string) => {
    try {
      const { getClosersByRegion } = await import('@/lib/firebase/firebaseUtils');
      const regionClosers = await getClosersByRegion(region);
      
      // Convert to the format expected by the existing closers state
      const closersList = regionClosers.map((closer: any) => ({
        id: closer.id,
        name: closer.displayName
      }));
      
      setClosers(closersList);
      console.log(`Loaded ${closersList.length} closers for region ${region}`);
    } catch (error) {
      console.error('Error loading closers:', error);
      setClosers([]);
    }
  };

  // Handle closer assignment confirmation
  const handleConfirmCloserAssignment = (setId: string, closerId: string, closerName: string) => {
    // Update the set with the assigned closer
    const updatedSets = sets.map(set => {
      if (set.id === setId) {
        return {
          ...set,
          closerId: closerId,
          closerName: closerName
        };
      }
      return set;
    });
    
    // Save to localStorage
    localStorage.setItem('customerSets', JSON.stringify(updatedSets));
    setSets(updatedSets);
    
    console.log(`Assigned closer ${closerName} to set ${setId}`);
  };

  // Function to count user's closed deals from projects - modified to be safe for SSR
  const countUserClosedDeals = (userId: string) => {
    if (typeof window === 'undefined') return 0;
    
    // Get projects from localStorage
    const savedProjects = localStorage.getItem('projects');
    if (!savedProjects) return 0;
    
    try {
      const projects = JSON.parse(savedProjects);
      // Count only this user's projects
      const userProjects = projects.filter((project: any) => project.userId === userId);
      return userProjects.length;
    } catch (e) {
      console.error("Error counting closed deals:", e);
      return 0;
    }
  };

  // Function to update user role based on number of sets - modified to be safe for SSR
  const updateUserRole = (userId: string, setsCount: number) => {
    if (!userId || typeof window === 'undefined') return;
    
    let newRole = "Intern Rep"; // Default role for 1-10 sets
    
    if (setsCount >= 11 && setsCount <= 20) {
      newRole = "Veteran Rep";
    } else if (setsCount >= 21) {
      newRole = "Pro Rep";
    }
    
    // Get current role from localStorage
    const currentRole = localStorage.getItem(`userRole_${userId}`);
    
    // Only update if role has changed
    if (currentRole !== newRole) {
      localStorage.setItem(`userRole_${userId}`, newRole);
      console.log(`Updated user ${userId} role to ${newRole} based on ${setsCount} closed deals`);
    }
  };

  // Prepare to move a set to Projects
  const prepareToMoveToProjects = (id: string) => {
    if (!isClient) return; // Don't run on server
    
    const setToMove = sets.find(set => set.id === id);
    if (!setToMove) return;
    
    // Pre-fill the form with the existing customer name
    setCloseFormData({
      ...closeFormData,
      customerName: setToMove.customerName
    });
    
    setCurrentSetId(id);
    setIsClosedVerified(false);
    setShowCloseModal(true);
  };

  // Function for moving a set to projects
  const handleMoveToProjects = () => {
    if (!isClient) return; // Don't run on server
    
    console.log("===== MOVING SET TO PROJECTS =====");
    // Make sure we have a current set ID and the verification is checked
    if (!currentSetId || !isClosedVerified) {
      console.log("Error: Missing currentSetId or not verified");
      return;
    }

    try {
      // Find the set to move
      const setToMove = sets.find(set => set.id === currentSetId);
      if (!setToMove) {
        console.log("Error: Could not find set with ID:", currentSetId);
        return;
      }
      
      console.log("Found set to move:", setToMove);
      
      // Calculate payment amount based on system size
      const systemSize = parseFloat(closeFormData.systemSize) || 0;
      const grossPPW = parseFloat(closeFormData.grossPPW) || 0;
      
      // Calculate gross cost
      const grossCost = grossPPW * systemSize * 1000;
      
      // Get existing projects to determine deal number and commission rate
      const savedProjects = localStorage.getItem('projects');
      console.log("Current projects in localStorage:", savedProjects);
      
      let existingProjects = savedProjects ? JSON.parse(savedProjects) : [];
      
      // Use the set's original creator userId if available, otherwise use current user
      const setUserId = setToMove.userId || user?.uid || '';
      
      // Filter to get only the original user's projects
      const userProjects = existingProjects.filter((p: any) => p.userId === setUserId);
      console.log("User's existing projects:", userProjects.length);
      
      // Determine the deal number (count of this user's existing projects + 1)
      const dealNumber = userProjects.length + 1;
      console.log("This will be deal number:", dealNumber);
      
      // Set commission rate based on tier
      let commissionRate = 200; // Default $200/kW for first 10 deals
      
      if (dealNumber > 10 && dealNumber <= 20) {
        commissionRate = 250; // $250/kW for deals 11-20
      }
      
      console.log("Using commission rate:", commissionRate);
      
      // Calculate payment amount based on commission rate and system size
      const paymentAmount = commissionRate * systemSize;
      
      // Calculate payment date (Friday of next week)
      const calculateNextFriday = () => {
        // Get current date
        const today = new Date();
        // Find the next Friday (5 = Friday)
        let daysUntilFriday = 5 - today.getDay();
        if (daysUntilFriday <= 0) {
          // If today is Friday or after, go to next week's Friday
          daysUntilFriday += 7;
        }
        // Add 7 more days to get to Friday of next week
        daysUntilFriday += 7;
        
        const nextFriday = new Date(today);
        nextFriday.setDate(today.getDate() + daysUntilFriday);
        return nextFriday.toISOString().split('T')[0];
      };
      
      // Set payment date based on payType for the setter
      const calculatedPaymentDate = calculateNextFriday();
      
      // Calculate payment date (6 days after PTO, if PTO date is set)
      let ptoPaymentDate = undefined;
      if (closeFormData.ptoDate) {
        const ptoDate = new Date(closeFormData.ptoDate);
        const paymentDate = new Date(ptoDate);
        paymentDate.setDate(paymentDate.getDate() + 6);
        ptoPaymentDate = paymentDate.toISOString().split('T')[0];
      }
      
      // Use current timestamp for created at
      const createdAt = new Date().toISOString();

      // Create new project with all the required information
      const newProject = {
        id: setToMove.id, // Use the original set ID
        customerName: closeFormData.customerName,
        address: setToMove.address,
        phoneNumber: setToMove.phoneNumber, // Transfer phone number from set
        email: setToMove.email, // Transfer email from set
        installDate: closeFormData.installDate || undefined,
        paymentDate: ptoPaymentDate || calculatedPaymentDate,
        siteSurveyDate: closeFormData.siteSurveyDate,
        siteSurveyTime: closeFormData.siteSurveyTime,
        permitDate: closeFormData.permitDate || undefined,
        inspectionDate: closeFormData.inspectionDate || undefined,
        ptoDate: closeFormData.ptoDate || undefined,
        paymentAmount: paymentAmount,
        status: "site_survey",
        systemSize: closeFormData.systemSize,
        grossPPW: closeFormData.grossPPW,
        financeType: closeFormData.financeType,
        lender: closeFormData.lender,
        adders: closeFormData.adders,
        batteryType: closeFormData.batteryType,
        batteryQuantity: parseInt(closeFormData.batteryQuantity) || 0,
        panelType: closeFormData.panelType,
        utilityBill: setToMove.utilityBill,
        userId: setUserId, // Use original creator's ID
        commissionRate: commissionRate, // Store the commission rate used
        dealNumber: dealNumber, // Store which deal number this is for the user
        createdAt: createdAt // Add timestamp for sorting
      };

      console.log("Created new project object:", newProject);

      // Add to projects in localStorage - ensure we append not replace
      existingProjects.push(newProject);
      
      console.log("Adding new project to localStorage, total projects:", existingProjects.length);
      localStorage.setItem('projects', JSON.stringify(existingProjects));
      
      // Remove from sets
      const updatedSets = sets.filter(set => set.id !== currentSetId);
      console.log("Removing set from sets list, remaining sets:", updatedSets.length);
      localStorage.setItem('customerSets', JSON.stringify(updatedSets));
      setSets(updatedSets);
      
      // Update user data with new deal count and commission
      const userDataKey = `userData_${setUserId}`;
      const storedUserData = localStorage.getItem(userDataKey);
      if (storedUserData) {
        const userData = JSON.parse(storedUserData);
        
        // Update deal count and total commission
        userData.dealCount = (userData.dealCount || 0) + 1;
        userData.totalCommission = (userData.totalCommission || 0) + paymentAmount;
        
        // Initialize commissionPayments array if it doesn't exist
        if (!userData.commissionPayments) {
          userData.commissionPayments = [];
        }
        
        // Add this commission payment to the user's commission payments
        userData.commissionPayments.push({
          amount: paymentAmount,
          date: calculatedPaymentDate,
          projectId: setToMove.id,
          description: `Commission for ${closeFormData.customerName} - ${closeFormData.systemSize}kW system`,
          status: 'pending',
          customerName: closeFormData.customerName,
          dealNumber: dealNumber,
          systemSize: parseFloat(closeFormData.systemSize),
          commissionRate: commissionRate
        });
        
        // Store updated user data
        localStorage.setItem(userDataKey, JSON.stringify(userData));
        
        // Update user role based on number of closed deals
        const closedDealsCount = dealNumber; // Use dealNumber as the count of closed deals
        updateUserRole(setUserId, closedDealsCount);
      }
      
      // Also update the current user's data if they are different from the set creator
      if (user && user.uid !== setUserId) {
        const currentUserDataKey = `userData_${user.uid}`;
        const currentUserData = localStorage.getItem(currentUserDataKey);
        
        if (currentUserData) {
          const userData = JSON.parse(currentUserData);
          
          // Initialize commissionPayments array if it doesn't exist
          if (!userData.commissionPayments) {
            userData.commissionPayments = [];
          }
          
          // Add this commission payment to the current user's commission payments
          userData.commissionPayments.push({
            amount: paymentAmount,
            date: calculatedPaymentDate,
            projectId: setToMove.id,
            description: `Commission for ${closeFormData.customerName} - ${closeFormData.systemSize}kW system`,
            status: 'pending',
            customerName: closeFormData.customerName,
            dealNumber: dealNumber,
            systemSize: parseFloat(closeFormData.systemSize),
            commissionRate: commissionRate
          });
          
          // Store updated user data
          localStorage.setItem(currentUserDataKey, JSON.stringify(userData));
          
          console.log("Added commission payment to current user's data");
        }
      }
      
      // Reset and close the modal
      setIsClosedVerified(false);
      setShowCloseModal(false);
      setCurrentSetId(null);
      setCloseFormData({
        customerName: "",
        systemSize: "",
        lender: "",
        financeType: "",
        batteryType: "",
        batteryQuantity: "0",
        panelType: "",
        grossPPW: "",
        siteSurveyDate: "",
        permitDate: "",
        installDate: "",
        inspectionDate: "",
        ptoDate: "",
        paymentDate: "",
        adders: [],
        siteSurveyTime: ""
      });
      
      // Show confirmation with commission details
              alert(`Congratulations on the deal!`);
      
      // Important: Force a refresh of the projects page data when user is redirected 
      localStorage.setItem('forceProjectsRefresh', 'true');
      
      console.log("===== SET SUCCESSFULLY MOVED TO PROJECTS =====");
      
      router.push("/projects");
      
    } catch (error) {
      console.error('Error moving set to projects:', error);
      alert('There was an error moving this set to projects. Please try again.');
    }
  };

  // Handle form input changes
  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    // All other form fields are handled here, adders are handled separately in their checkbox component
    setCloseFormData({
      ...closeFormData,
      [name]: value
    });
  };

  // Handle adder selection
  const handleAdderChange = (adder: string) => {
    const updatedAdders = [...closeFormData.adders];
    const adderIndex = updatedAdders.indexOf(adder);
    
    if (adderIndex === -1) {
      // Add the adder
      updatedAdders.push(adder);
    } else {
      // Remove the adder
      updatedAdders.splice(adderIndex, 1);
    }
    
    setCloseFormData({
      ...closeFormData,
      adders: updatedAdders
    });
  };

  // Change the return to use the ClientOnly component
  return (
    <ClientOnly>
      {loading ? (
        <div className="flex items-center justify-center min-h-screen theme-bg-primary">
          <div className={`animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 ${darkMode ? 'border-cyan-500' : 'border-cyan-500'}`}></div>
        </div>
      ) : !user ? (
        <div className="flex items-center justify-center min-h-screen theme-bg-primary">
          <div className="text-center">
            <p className="theme-text-primary mb-4">Please sign in to access the schedule.</p>
            <button 
              onClick={() => router.push("/")}
              className={`px-4 py-2 rounded ${darkMode ? 'bg-cyan-500 hover:bg-cyan-600' : 'bg-cyan-500 hover:bg-cyan-600'} text-white`}
            >
              Go to Sign In
            </button>
          </div>
        </div>
      ) : (
        <div className="flex h-screen theme-bg-primary">
          {/* Sidebar */}
          <Sidebar 
            darkMode={darkMode}
            signOut={signOut}
            sidebarOpen={sidebarOpen}
            setSidebarOpen={setSidebarOpen}
          />

          {/* Main content */}
          <div className="flex-1 overflow-auto theme-bg-secondary flex flex-col h-screen">
            {/* Header */}
            <header className="standard-header flex-shrink-0">
              <div className="standard-header-content">
                <div className="flex items-center mb-4">
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
                    <div className="header-logo-center">
                      <AmbientLogo theme={darkMode ? 'dark' : 'light'} size="xl" />
                    </div>
                  )}
                </div>
              </div>
            </header>

            {/* Schedule content */}
            <main className="px-4 py-4 flex-1 overflow-auto">
              <div className="w-full h-full flex flex-col">
                {/* Filters */}
                <div className="mb-4 theme-bg-tertiary p-4 rounded-lg border theme-border-primary shadow-sm flex-shrink-0">
                  <div className="flex flex-wrap items-center gap-4">
                    <div>
                      <label className="block text-sm font-medium theme-text-secondary mb-1">
                        Filter by Closer
                      </label>
                      <select
                        className="w-64 theme-bg-quaternary border theme-border-primary rounded p-2 theme-text-primary focus:outline-none"
                        value={selectedCloser}
                        onChange={(e) => setSelectedCloser(e.target.value)}
                      >
                        <option value="all">All Closers</option>
                        {closers.map(closer => (
                          <option key={closer.id} value={closer.id}>
                            {closer.name}
                          </option>
                        ))}
                        {/* This is where closer names will appear once added */}
                      </select>
                    </div>
                    
                    <div className="ml-auto flex gap-2">
                      <button
                        className={`px-3 py-2 rounded text-sm font-medium theme-text-primary border theme-border-primary ${darkMode ? 'hover:bg-black' : 'hover:bg-gray-200'} transition-colors duration-200`}
                      >
                        Export Schedule
                      </button>
                      <button
                        onClick={() => {
                          // For now, this will show a message that individual assignment is available
                          alert('To assign closers, click "Assign Closer" on individual appointments below.');
                        }}
                        className={`px-3 py-2 rounded text-sm font-medium ${darkMode ? 'bg-cyan-500 hover:bg-cyan-600 text-white' : 'bg-cyan-500 hover:bg-cyan-600 text-white'} transition-colors duration-200`}
                      >
                        Assign Closers
                      </button>
                    </div>
                  </div>
                </div>
                
                {/* Calendar Header */}
                <div className="mb-4 flex items-center justify-between flex-shrink-0">
                  <div className="flex items-center">
                    <Calendar className="h-5 w-5 mr-2 theme-text-primary" />
                    <h2 className="text-xl font-semibold theme-text-primary">{formatDate(currentMonth)}</h2>
                  </div>
                  
                  <div className="flex space-x-2">
                    <button 
                      onClick={() => changeMonth(-1)}
                      className={`p-2 rounded-full ${darkMode ? 'hover:bg-black' : 'hover:bg-gray-200'} theme-text-primary transition-colors duration-200`}
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    <button 
                      onClick={() => setCurrentMonthTimestamp(new Date().getTime())}
                      className={`px-3 py-1 rounded ${darkMode ? 'bg-black hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'} theme-text-primary text-sm transition-colors duration-200`}
                    >
                      Today
                    </button>
                    <button 
                      onClick={() => changeMonth(1)}
                      className={`p-2 rounded-full ${darkMode ? 'hover:bg-black' : 'hover:bg-gray-200'} theme-text-primary transition-colors duration-200`}
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>
                  </div>
                </div>
                
                {/* Information note */}
                
                {/* Calendar */}
                <div className="theme-bg-tertiary border theme-border-primary rounded-lg overflow-hidden shadow-sm w-full flex-1 flex flex-col min-h-[500px]">
                  {/* Days of the week */}
                  <div className="grid grid-cols-7 theme-bg-quaternary border-b theme-border-primary">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, i) => (
                      <div key={i} className="py-2 text-center text-sm font-medium theme-text-secondary">
                        {day}
                      </div>
                    ))}
                  </div>
                  
                  {/* Calendar days */}
                  <div className="grid grid-cols-7 auto-rows-fr flex-1">{/* This flex-1 will make the grid expand */}
                    {generateCalendarDays().map((day, index) => {
                      const isToday = day.date.toDateString() === new Date().toDateString();
                      const isSelected = selectedDate && day.date.toDateString() === selectedDate.toDateString();
                      const hasAppts = hasAppointments(day.date);
                      
                      return (
                        <div 
                          key={index}
                          onClick={() => handleSelectDate(day.date)}
                          className={`
                            p-2 border-b border-r theme-border-primary relative h-20 
                            ${!day.isCurrentMonth ? 'theme-text-secondary opacity-40' : 'theme-text-primary'} 
                            ${isToday ? (darkMode ? 'bg-amber-900 bg-opacity-20' : 'bg-blue-100') : ''} 
                            ${isSelected ? (darkMode ? 'bg-amber-600 bg-opacity-20' : 'bg-blue-200') : ''}
                            hover:theme-bg-quaternary cursor-pointer transition-colors duration-200
                          `}
                        >
                          <div className="flex justify-between">
                            <span className={`
                              text-sm font-medium 
                              ${isToday ? (darkMode ? 'bg-cyan-500 text-white' : 'bg-cyan-500 text-white') : ''} 
                              ${isToday ? 'h-6 w-6 flex items-center justify-center rounded-full' : ''}
                            `}>
                              {day.date.getDate()}
                            </span>
                            {hasAppts && (
                              <span className={`h-2 w-2 rounded-full ${darkMode ? 'bg-cyan-500' : 'bg-cyan-500'}`}></span>
                            )}
                          </div>
                          
                          {/* Preview of appointments */}
                          {day.isCurrentMonth && hasAppts && (
                            <div className="mt-1 overflow-hidden max-h-16">
                              {getAppointmentsForDate(day.date).slice(0, 2).map((set, i) => (
                                <div key={i} className="text-xs bg-opacity-80 py-0.5 px-1 mb-0.5 truncate rounded theme-text-primary theme-bg-quaternary">
                                  {formatTime(set.appointmentTime)} - {set.customerName}
                                </div>
                              ))}
                              {getAppointmentsForDate(day.date).length > 2 && (
                                <div className="text-xs theme-text-secondary">
                                  +{getAppointmentsForDate(day.date).length - 2} more
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
                
                {/* Selected day appointments */}
                {selectedDate && (
                  <div className="mt-4 theme-bg-tertiary border theme-border-primary rounded-lg p-4 shadow-sm flex-shrink-0">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold theme-text-primary">
                        {selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                      </h3>
                      <div className="flex gap-2">
                        <button 
                          className={`flex items-center px-3 py-1.5 rounded text-sm ${darkMode ? 'bg-amber-500 hover:bg-amber-600' : 'bg-blue-500 hover:bg-blue-600'} text-white transition-colors duration-200`}
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Add Appointment
                        </button>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      {getAppointmentsForDate(selectedDate).length > 0 ? (
                        getAppointmentsForDate(selectedDate).map((set, index) => (
                          <div key={index} className="p-4 theme-bg-quaternary rounded-lg border theme-border-primary">
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <h4 className="font-medium theme-text-primary flex items-center mb-1">
                                  <User className="h-4 w-4 mr-1.5 opacity-70" />
                                  {set.customerName}
                                  {set.isSpanishSpeaker && (
                                    <span className="ml-2 text-xs px-2 py-0.5 bg-yellow-500 text-yellow-800 dark:bg-yellow-600 dark:text-yellow-100 rounded-full">
                                      Spanish
                                    </span>
                                  )}
                                </h4>
                                <div className="text-sm theme-text-secondary flex items-center mb-1">
                                  <Home className="h-4 w-4 mr-1.5 opacity-70" />
                                  {set.address}
                                </div>
                                <div className="text-sm theme-text-secondary flex items-center mb-1">
                                  <Phone className="h-4 w-4 mr-1.5 opacity-70" />
                                  {set.phoneNumber}
                                </div>
                                <div className="text-sm theme-text-secondary flex items-center mt-2">
                                  <Clock className="h-4 w-4 mr-1.5 opacity-70" />
                                  {formatTime(set.appointmentTime)}
                                </div>
                              </div>
                              
                              <div className="flex flex-col space-y-2">
                                {set.utilityBill && (
                                  <button 
                                    onClick={() => handleViewDocuments(set)}
                                    className={`px-3 py-1.5 text-xs ${darkMode ? 'bg-black text-gray-200 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'} rounded transition-colors duration-200`}
                                  >
                                    Utility Bill
                                  </button>
                                )}
                                
                                {/* Show "Mark as Closed" button for authorized users */}
                                {canCompleteSet(set) && (
                                  <button 
                                    onClick={() => prepareToMoveToProjects(set.id)}
                                    className="px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white text-xs rounded transition-colors duration-200"
                                  >
                                    Mark as Closed
                                  </button>
                                )}
                              </div>
                            </div>
                            
                            {set.notes && (
                              <div className="mt-3 pt-3 border-t theme-border-primary">
                                <p className="text-sm theme-text-secondary">
                                  <span className="font-medium theme-text-primary">Notes:</span> {set.notes}
                                </p>
                              </div>
                            )}
                            
                            <div className="mt-3 pt-3 border-t theme-border-primary flex justify-between items-center">
                              <div>
                                {set.closerName ? (
                                  <div className={`px-3 py-1.5 rounded-full ${darkMode ? 'bg-amber-500' : 'bg-blue-500'} text-white text-sm font-medium`}>
                                    {set.closerName}
                                  </div>
                                ) : (
                                  <button 
                                    onClick={() => handleAssignCloser(set)}
                                    className="px-3 py-1.5 bg-gray-200 dark:bg-black rounded-full text-sm theme-text-secondary hover:theme-text-primary transition-colors duration-200"
                                  >
                                    Assign Closer
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-10 theme-text-secondary">
                          <List className="h-10 w-10 mx-auto mb-2 opacity-50" />
                          <p>No appointments scheduled for this day</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </main>
          </div>
          
          {/* Documents Modal */}
          {showDocumentsModal && selectedSetDocuments && (
            <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm z-50">
              <div className="theme-bg-tertiary rounded-lg shadow-xl max-w-2xl w-full mx-4 theme-border-primary border">
                <div className="p-4 border-b theme-border-primary flex items-center justify-between">
                  <h3 className="text-lg font-semibold theme-text-primary">
                    Utility Bill - {selectedSetDocuments.customerName}
                  </h3>
                  <button
                    onClick={() => setShowDocumentsModal(false)}
                    className="theme-text-secondary hover:theme-text-primary"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
                
                <div className="p-6">
                  {selectedSetDocuments.utilityBill ? (
                    <div className="border theme-border-primary rounded-lg overflow-hidden">
                      <div className="p-4 theme-bg-quaternary">
                        <div className="flex items-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className={`h-6 w-6 mr-2 ${darkMode ? 'text-cyan-500' : 'text-cyan-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          <span className="theme-text-primary font-medium">Utility Bill</span>
                        </div>
                        
                        <div className="mt-4">
                          {/* Handle both PDF and JPEG formats */}
                          {selectedSetDocuments.utilityBill.startsWith('data:') ? (
                            <div className="flex flex-col items-center">
                              <div className="w-full h-96 border theme-border-primary rounded-md overflow-hidden mb-4">
                                {selectedSetDocuments.utilityBill.startsWith('data:image/') ? (
                                  // Display JPEG/image files
                                  <img 
                                    src={selectedSetDocuments.utilityBill} 
                                    alt="Utility Bill" 
                                    className="w-full h-full object-contain"
                                  />
                                ) : (
                                  // Display PDF files
                                  <iframe 
                                    src={selectedSetDocuments.utilityBill} 
                                    className="w-full h-full"
                                    title="Utility Bill"
                                  ></iframe>
                                )}
                              </div>
                              <button 
                                className={`inline-flex items-center px-4 py-2 rounded-md text-sm font-medium ${darkMode ? 'bg-cyan-500 hover:bg-cyan-600' : 'bg-cyan-500 hover:bg-cyan-600'} text-white`}
                                onClick={() => window.open(selectedSetDocuments.utilityBill, '_blank')}
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                </svg>
                                Open in New Tab
                              </button>
                            </div>
                          ) : (
                            <div className="p-5 border theme-border-primary rounded-md theme-text-primary text-center">
                              <p className="mb-2">File preview not available</p>
                              <button 
                                className={`inline-flex items-center px-4 py-2 rounded-md text-sm font-medium ${darkMode ? 'bg-amber-500 hover:bg-amber-600' : 'bg-blue-500 hover:bg-blue-600'} text-white`}
                                onClick={() => window.open(selectedSetDocuments.utilityBill, '_blank')}
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                </svg>
                                Download File
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 theme-text-secondary">
                      <p>No utility bill uploaded for this customer.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
          
          {/* Close Set Modal - Added from Sets page with modifications */}
          {showCloseModal && (
            <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-75 backdrop-blur-sm p-4">
              <div className="theme-bg-tertiary rounded-lg shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
                <div className="sticky top-0 z-10 theme-bg-tertiary p-4 border-b theme-border-primary flex justify-between items-center">
                  <h2 className="text-xl font-semibold theme-text-primary">Complete Set & Move to Projects</h2>
                  <button
                    onClick={() => setShowCloseModal(false)}
                    className="theme-text-secondary hover:theme-text-primary transition-colors"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>
                
                <div className="p-4">
                  <div className="mb-6">
                    <div className="flex items-center">
                      <input
                        id="close-verification"
                        type="checkbox"
                        className={`w-5 h-5 rounded border-gray-600 bg-black ${darkMode ? 'text-amber-500 focus:ring-amber-500' : 'text-blue-500 focus:ring-blue-500'} focus:ring-opacity-50`}
                        checked={isClosedVerified}
                        onChange={(e) => setIsClosedVerified(e.target.checked)}
                      />
                      <label htmlFor="close-verification" className="ml-2 block theme-text-primary text-sm font-medium">
                        I verify this set is complete and ready to be moved to projects
                      </label>
                    </div>
                    <p className="theme-text-secondary text-xs mt-1 ml-7">
                      You must verify the set is complete to continue
                    </p>
                  </div>
                  
                  <form id="closeSetForm" onSubmit={(e) => { e.preventDefault(); handleMoveToProjects(); }}>
                    <fieldset disabled={!isClosedVerified} className={!isClosedVerified ? "opacity-50" : ""}>
                      {/* Customer Name */}
                      <div className="mb-4">
                        <label className="block theme-text-tertiary text-sm font-medium mb-2">
                          Customer Name
                        </label>
                        <input
                          type="text"
                          name="customerName"
                          className={`w-full p-2 border theme-border-primary rounded focus:outline-none ${darkMode ? 'focus:border-amber-500' : 'focus:border-blue-500'} theme-bg-quaternary theme-text-primary`}
                          value={closeFormData.customerName}
                          onChange={handleFormChange}
                          required
                        />
                      </div>
                      
                      {/* Two columns for System Size and Gross PPW */}
                      <div className="flex gap-4 mb-4">
                        <div className="flex-1">
                          <label className="block theme-text-tertiary text-sm font-medium mb-2">
                            System Size (kW)
                          </label>
                          <input
                            type="number"
                            name="systemSize"
                            step="0.01"
                            min="0"
                            className={`w-full p-2 border theme-border-primary rounded focus:outline-none ${darkMode ? 'focus:border-amber-500' : 'focus:border-blue-500'} theme-bg-quaternary theme-text-primary`}
                            value={closeFormData.systemSize}
                            onChange={handleFormChange}
                            required
                          />
                        </div>
                        <div className="flex-1">
                          <label className="block theme-text-tertiary text-sm font-medium mb-2">
                            Gross PPW
                          </label>
                          <input
                            type="number"
                            name="grossPPW"
                            step="0.01"
                            min="0"
                            className={`w-full p-2 border theme-border-primary rounded focus:outline-none ${darkMode ? 'focus:border-amber-500' : 'focus:border-blue-500'} theme-bg-quaternary theme-text-primary`}
                            value={closeFormData.grossPPW}
                            onChange={handleFormChange}
                            required
                          />
                        </div>
                      </div>
                      
                      {/* Adders */}
                      <div className="mb-4">
                        <label className="block theme-text-tertiary text-sm font-medium mb-2">
                          Adders
                        </label>
                        <div className="space-y-2">
                          {['Main Panel Upgrade', 'Roofing Work', 'EV Charger', 'Electrical Work', 'Critter Guard', 'Extended Warranty'].map((adder) => (
                            <div key={adder} className="flex items-center">
                              <input
                                id={`adder-${adder.replace(/\s+/g, '-').toLowerCase()}`}
                                type="checkbox"
                                className={`rounded border-gray-600 bg-black ${darkMode ? 'text-amber-500 focus:ring-amber-500' : 'text-blue-500 focus:ring-blue-500'} focus:ring-opacity-50 mr-2`}
                                checked={closeFormData.adders.includes(adder)}
                                onChange={() => handleAdderChange(adder)}
                              />
                              <label htmlFor={`adder-${adder.replace(/\s+/g, '-').toLowerCase()}`} className="theme-text-primary text-sm">
                                {adder}
                              </label>
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      {/* Financing Info */}
                      <div className="mb-4">
                        <label className="block theme-text-tertiary text-sm font-medium mb-2">
                          Finance Type
                        </label>
                        <select
                          name="financeType"
                          className={`w-full p-2 border theme-border-primary rounded focus:outline-none ${darkMode ? 'focus:border-amber-500' : 'focus:border-blue-500'} theme-bg-quaternary theme-text-primary`}
                          value={closeFormData.financeType}
                          onChange={handleFormChange}
                          required
                        >
                          <option value="">Select Finance Type</option>
                          <option value="cash">Cash</option>
                          <option value="loan">Loan</option>
                          <option value="lease">Lease</option>
                          <option value="ppa">PPA</option>
                        </select>
                      </div>
                      
                      {/* Lender */}
                      <div className="mb-4">
                        <label className="block theme-text-tertiary text-sm font-medium mb-2">
                          Lender
                        </label>
                        <select
                          name="lender"
                          className={`w-full p-2 border theme-border-primary rounded focus:outline-none ${darkMode ? 'focus:border-amber-500' : 'focus:border-blue-500'} theme-bg-quaternary theme-text-primary`}
                          value={closeFormData.lender}
                          onChange={handleFormChange}
                          required
                        >
                          <option value="">Select Lender</option>
                          <option value="Sunlight">Sunlight</option>
                          <option value="GoodLeap">GoodLeap</option>
                          <option value="Sunrun">Sunrun</option>
                          <option value="Mosaic">Mosaic</option>
                          <option value="Sunnova">Sunnova</option>
                          <option value="Cash">Cash</option>
                        </select>
                      </div>
                      
                      {/* Two columns for Panel Type and Battery */}
                      <div className="flex gap-4 mb-4">
                        <div className="flex-1">
                          <label className="block theme-text-tertiary text-sm font-medium mb-2">
                            Panel Type
                          </label>
                          <select
                            name="panelType"
                            className={`w-full p-2 border theme-border-primary rounded focus:outline-none ${darkMode ? 'focus:border-amber-500' : 'focus:border-blue-500'} theme-bg-quaternary theme-text-primary`}
                            value={closeFormData.panelType}
                            onChange={handleFormChange}
                            required
                          >
                            <option value="">Select Panel</option>
                            <option value="REC 400W">REC 400W</option>
                            <option value="Q Cells 400W">Q Cells 400W</option>
                            <option value="SunPower 425W">SunPower 425W</option>
                            <option value="Tesla 425W">Tesla 425W</option>
                          </select>
                        </div>
                        <div className="flex-1">
                          <label className="block theme-text-tertiary text-sm font-medium mb-2">
                            Battery Type
                          </label>
                          <select
                            name="batteryType"
                            className={`w-full p-2 border theme-border-primary rounded focus:outline-none ${darkMode ? 'focus:border-amber-500' : 'focus:border-blue-500'} theme-bg-quaternary theme-text-primary`}
                            value={closeFormData.batteryType}
                            onChange={handleFormChange}
                          >
                            <option value="">No Battery</option>
                            <option value="Tesla Powerwall">Tesla Powerwall</option>
                            <option value="Enphase IQ Battery">Enphase IQ Battery</option>
                            <option value="SunPower SunVault">SunPower SunVault</option>
                            <option value="LG Chem RESU">LG Chem RESU</option>
                          </select>
                        </div>
                      </div>
                      
                      {/* Battery Quantity (only if battery type is selected) */}
                      {closeFormData.batteryType && (
                        <div className="mb-4">
                          <label className="block theme-text-tertiary text-sm font-medium mb-2">
                            Battery Quantity
                          </label>
                          <input
                            type="number"
                            name="batteryQuantity"
                            min="1"
                            className={`w-full p-2 border theme-border-primary rounded focus:outline-none ${darkMode ? 'focus:border-amber-500' : 'focus:border-blue-500'} theme-bg-quaternary theme-text-primary`}
                            value={closeFormData.batteryQuantity}
                            onChange={handleFormChange}
                          />
                        </div>
                      )}
                      
                      {/* Site Survey Date and Time */}
                      <div className="mb-4">
                        <div className="flex gap-4">
                          <div className="flex-1">
                            <label className="block theme-text-tertiary text-sm font-medium mb-2">
                              Site Survey Date
                            </label>
                            <input
                              type="date"
                              name="siteSurveyDate"
                              className={`w-full p-2 border theme-border-primary rounded focus:outline-none ${darkMode ? 'focus:border-amber-500' : 'focus:border-blue-500'} theme-bg-quaternary theme-text-primary`}
                              value={closeFormData.siteSurveyDate}
                              onChange={handleFormChange}
                              required
                            />
                          </div>
                          <div className="flex-1">
                            <label className="block theme-text-tertiary text-sm font-medium mb-2">
                              Site Survey Time
                            </label>
                            <input
                              type="time"
                              name="siteSurveyTime"
                              className={`w-full p-2 border theme-border-primary rounded focus:outline-none ${darkMode ? 'focus:border-amber-500' : 'focus:border-blue-500'} theme-bg-quaternary theme-text-primary`}
                              value={closeFormData.siteSurveyTime}
                              onChange={handleFormChange}
                              required
                            />
                          </div>
                        </div>
                      </div>
                      
                      {/* Optional Dates */}
                      <div className="mb-4">
                        <label className="block theme-text-tertiary text-sm font-medium mb-2">
                          Permit Date (optional)
                        </label>
                        <input
                          type="date"
                          name="permitDate"
                          className={`w-full p-2 border theme-border-primary rounded focus:outline-none ${darkMode ? 'focus:border-amber-500' : 'focus:border-blue-500'} theme-bg-quaternary theme-text-primary`}
                          value={closeFormData.permitDate}
                          onChange={handleFormChange}
                        />
                      </div>
                      
                      <div className="mb-4">
                        <label className="block theme-text-tertiary text-sm font-medium mb-2">
                          Install Date (optional)
                        </label>
                        <input
                          type="date"
                          name="installDate"
                          className={`w-full p-2 border theme-border-primary rounded focus:outline-none ${darkMode ? 'focus:border-amber-500' : 'focus:border-blue-500'} theme-bg-quaternary theme-text-primary`}
                          value={closeFormData.installDate}
                          onChange={handleFormChange}
                        />
                      </div>
                      
                      <div className="mb-4">
                        <label className="block theme-text-tertiary text-sm font-medium mb-2">
                          Inspection Date (optional)
                        </label>
                        <input
                          type="date"
                          name="inspectionDate"
                          className={`w-full p-2 border theme-border-primary rounded focus:outline-none ${darkMode ? 'focus:border-amber-500' : 'focus:border-blue-500'} theme-bg-quaternary theme-text-primary`}
                          value={closeFormData.inspectionDate}
                          onChange={handleFormChange}
                        />
                      </div>
                      
                      <div className="mb-4">
                        <label className="block theme-text-tertiary text-sm font-medium mb-2">
                          PTO Date (optional)
                        </label>
                        <input
                          type="date"
                          name="ptoDate"
                          className={`w-full p-2 border theme-border-primary rounded focus:outline-none ${darkMode ? 'focus:border-amber-500' : 'focus:border-blue-500'} theme-bg-quaternary theme-text-primary`}
                          value={closeFormData.ptoDate}
                          onChange={handleFormChange}
                        />
                      </div>
                      
                      <div className="sticky bottom-0 theme-bg-tertiary pt-4 pb-2 border-t theme-border-primary mt-5">
                        <div className="flex justify-end space-x-3">
                          <button
                            type="button"
                            onClick={() => setShowCloseModal(false)}
                            className="px-4 py-2 theme-bg-quaternary theme-text-primary theme-border-primary border rounded"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            disabled={!isClosedVerified}
                            className={`px-4 py-2 rounded text-white flex items-center ${
                              isClosedVerified 
                                ? (darkMode ? 'bg-amber-500 hover:bg-amber-600' : 'bg-blue-500 hover:bg-blue-600') 
                                : 'bg-gray-500 cursor-not-allowed'
                            }`}
                          >
                            <Check className="h-4 w-4 mr-2" />
                            Complete & Move to Projects
                          </button>
                        </div>
                      </div>
                    </fieldset>
                  </form>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Closer Assignment Modal */}
      <CloserAssignmentModal
        isVisible={showCloserAssignmentModal}
        onClose={() => {
          setShowCloserAssignmentModal(false);
          setSelectedSetForAssignment(null);
        }}
        set={selectedSetForAssignment as any}
        onAssignCloser={handleConfirmCloserAssignment}
        userRegion={userData?.region}
      />
    </ClientOnly>
  );
} 